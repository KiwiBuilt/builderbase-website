import { NextRequest, NextResponse } from 'next/server'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const { 
      prompt, 
      type = 'content', // 'content', 'title', 'complete' (all fields)
      customRules = '', // Custom instructions to always follow
      topicContext = '', // Background info about the topic
      category = 'General',
    } = await request.json()

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not configured')
      return NextResponse.json(
        { error: 'AI service is not configured' },
        { status: 500 }
      )
    }

    // Fetch global rules from Firestore
    let globalRules = ''
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'aiRules'))
      if (settingsDoc.exists()) {
        globalRules = settingsDoc.data()?.rules || ''
      }
    } catch (error) {
      console.error('Error fetching global rules:', error)
      // Continue without global rules if fetch fails
    }

    // Build the system instructions with custom + global rules
    let systemPrompt = `You are a professional blog writer for Builder Base - construction management software in New Zealand.

CORE RULES (ALWAYS FOLLOW):
- Write for builders, construction managers, and site supervisors
- Use clear, professional language with practical examples
- Include actionable advice and tips
- Keep paragraphs short (max 3 sentences)
- Use contractions naturally (don't, it's, etc)
- Focus on NZ construction industry best practices
- Be encouraging and supportive in tone`

    if (globalRules) {
      systemPrompt += `\n\nGLOBAL RULES (Apply to ALL posts):\n${globalRules}`
    }

    if (customRules) {
      systemPrompt += `\n\nPOST-SPECIFIC RULES:\n${customRules}`
    }

    // Build context awareness
    let contextSection = ''
    if (topicContext) {
      contextSection = `\n\nTOPIC BACKGROUND:\n${topicContext}\n`
    }

    // Different prompts based on type
    let fullPrompt = ''
    let responseFormat = {}

    if (type === 'complete') {
      // Generate everything at once
      fullPrompt = `${systemPrompt}${contextSection}

TASK: Generate a complete blog post with title, meta description, keywords, and body.

Topic/Prompt: "${prompt}"
Category: ${category}

Return ONLY valid JSON (no markdown, no code blocks - raw JSON) with this structure:
{
  "title": "SEO-optimized title (50-60 chars)",
  "metaDescription": "Meta description for Google (155-160 chars)",
  "keywords": "keyword1, keyword2, keyword3, keyword4, keyword5",
  "content": "<h2>Subheading</h2><p>Paragraphs with html tags...</p><ul><li>...</li></ul>",
  "idea": "Brief explanation of the content strategy"
}`
      responseFormat = { type: 'json', title: 'Blog Post' }
    } else if (type === 'title') {
      fullPrompt = `${systemPrompt}${contextSection}

TASK: Generate only a compelling SEO-optimized title.

Topic/Prompt: "${prompt}"
Category: ${category}

Return ONLY a JSON object:
{
  "title": "Your 50-60 character title here",
  "alternatives": ["Alternative title 1", "Alternative title 2", "Alternative title 3"]
}`
    } else {
      // Default: just content body
      fullPrompt = `${systemPrompt}${contextSection}

TASK: Write the body content for a blog post.

Topic/Prompt: "${prompt}"
Category: ${category}

Format as HTML with <h2>, <h3>, <p>, <ul>, <li> tags.
Keep content between 300-800 words.
Make it educational and actionable.

Content:`
    }

    // Call Google Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: fullPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: type === 'complete' ? 2000 : 1200,
            temperature: 0.7,
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('Gemini API error:', error)
      return NextResponse.json(
        { error: 'Failed to generate content' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    if (!generatedText) {
      return NextResponse.json(
        { error: 'No content generated' },
        { status: 500 }
      )
    }

    // Parse response based on type
    let result = {}

    if (type === 'complete') {
      // Try to parse JSON response for complete posts
      try {
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0])
        } else {
          // Fallback: wrap in structure
          result = {
            content: generatedText,
            title: prompt.substring(0, 60),
            metaDescription: prompt.substring(0, 160),
            keywords: 'construction, builder, nz',
          }
        }
      } catch (e) {
        result = {
          content: generatedText,
          title: prompt.substring(0, 60),
          metaDescription: prompt.substring(0, 160),
          keywords: 'construction, builder, nz',
        }
      }
    } else if (type === 'title') {
      try {
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0])
        } else {
          result = { title: generatedText.trim() }
        }
      } catch (e) {
        result = { title: generatedText.trim() }
      }
    } else {
      // Simple content response
      result = {
        content: generatedText.trim(),
      }
    }

    return NextResponse.json({
      success: true,
      type,
      ...result,
    })
  } catch (error) {
    console.error('Error generating content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
