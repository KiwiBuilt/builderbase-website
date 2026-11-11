import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { sanitizeBlogHtml } from '@/lib/blog-content'
import { geminiModelCandidates, generationPrompt, parseModelJson } from '@/lib/gemini'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const noStore = { 'Cache-Control': 'no-store' }

type GeminiPart = { text?: string; inlineData?: { mimeType: string; data: string } }

async function readGlobalRules(): Promise<string> {
  try {
    const snap = await getAdminFirestore().collection('settings').doc('aiRules').get()
    return typeof snap.data()?.rules === 'string' ? snap.data()?.rules.slice(0, 10_000) : ''
  } catch (error) {
    console.error('AI rules were not loaded:', error instanceof Error ? error.message : 'unknown')
    return ''
  }
}

async function callGemini(apiKey: string, parts: GeminiPart[], maxOutputTokens: number) {
  const models = geminiModelCandidates(process.env.GEMINI_MODEL)
  let lastStatus = 404
  for (const model of models) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { maxOutputTokens, temperature: 0.7 },
        }),
      }
    )
    if (response.status === 404 && models.length > 1) {
      lastStatus = 404
      continue
    }
    return response
  }
  return new Response(JSON.stringify({ error: { message: 'No configured Gemini model is available.' } }), {
    status: lastStatus,
  })
}

function textFrom(data: { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }): string {
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || ''
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Sign in to use the AI generator.' }, { status: 401, headers: noStore })
    }

    const body = await request.json()
    const type = typeof body?.type === 'string' ? body.type : 'content'
    const customRules = typeof body?.customRules === 'string' ? body.customRules.slice(0, 2000) : ''
    const topicContext = typeof body?.topicContext === 'string' ? body.topicContext.slice(0, 4000) : ''
    const category = typeof body?.category === 'string' ? body.category.slice(0, 40) : 'General'
    const imageData = typeof body?.imageData === 'string' ? body.imageData : ''
    const imageType = typeof body?.imageType === 'string' ? body.imageType : 'image/jpeg'

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service is not configured' }, { status: 500, headers: noStore })
    }

    if (type === 'image-vision') {
      if (!imageData || imageData.length > 2_000_000) {
        return NextResponse.json({ error: 'An image is required.' }, { status: 400, headers: noStore })
      }
      const visionPrompt = `You are analyzing a construction image for the Builder Base blog. Write a concise SEO description of what is shown (max 160 characters). Focus on the practical building or site-management subject.

${customRules ? `Additional instructions: ${customRules}` : ''}

Return ONLY a JSON object:
{ "content": "description under 160 characters" }`
      const response = await callGemini(
        apiKey,
        [
          { text: visionPrompt },
          { inlineData: { mimeType: imageType, data: imageData } },
        ],
        200
      )
      if (!response.ok) {
        console.error('Gemini vision error status:', response.status)
        return NextResponse.json({ error: 'Failed to analyze image' }, { status: 502, headers: noStore })
      }
      const visionData = await response.json()
      const text = textFrom(visionData)
      const parsed = parseModelJson(text)
      const content = typeof parsed?.content === 'string' ? parsed.content : text
      return NextResponse.json({ content: content.replace(/<[^>]*>/g, '').slice(0, 160) }, { headers: noStore })
    }

    const prompt = generationPrompt(body).slice(0, 8000)
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400, headers: noStore })
    }

    const globalRules = await readGlobalRules()
    let systemPrompt = `You are a professional blog writer for Builder Base, construction management software for New Zealand builders.

CORE RULES (ALWAYS FOLLOW):
- Write for builders, construction managers, and site supervisors
- Use clear, professional language with practical examples
- Include actionable advice and tips
- Keep paragraphs short (max 3 sentences)
- Use contractions naturally (don't, it's, etc)
- Focus on NZ construction industry best practices
- Be encouraging and supportive in tone
- Never use an h1 heading. The page template already renders the title as the only h1. Use h2 and h3 only.`

    if (globalRules) systemPrompt += `\n\nGLOBAL RULES (Apply to ALL posts):\n${globalRules}`
    if (customRules) systemPrompt += `\n\nPOST-SPECIFIC RULES:\n${customRules}`
    const contextSection = topicContext ? `\n\nTOPIC BACKGROUND:\n${topicContext}\n` : ''

    let fullPrompt = ''
    if (type === 'complete') {
      fullPrompt = `${systemPrompt}${contextSection}

TASK: Generate a complete blog post with title, meta description, keywords, excerpt, and body.

Topic/Prompt: "${prompt}"
Category: ${category}

Return ONLY valid JSON (no markdown, no code blocks) with this structure:
{
  "title": "SEO-optimized title (50-60 chars)",
  "metaDescription": "Meta description for Google (120-160 chars)",
  "excerpt": "One or two sentence summary for the blog card (max 220 chars)",
  "keywords": "keyword1, keyword2, keyword3, keyword4, keyword5",
  "content": "<h2>Subheading</h2><p>Paragraphs...</p>"
}`
    } else if (type === 'title') {
      fullPrompt = `${systemPrompt}${contextSection}

TASK: Generate only a compelling SEO-optimized title.

Topic/Prompt: "${prompt}"
Category: ${category}

Return ONLY a JSON object:
{
  "title": "Your 50-60 character title here"
}`
    } else {
      fullPrompt = `${systemPrompt}${contextSection}

TASK: Write the body content for a blog post.

Topic/Prompt: "${prompt}"
Category: ${category}

Format as HTML with <h2>, <h3>, <p>, <ul>, and <li> tags. Do not use <h1>.
Keep content between 300-800 words.
Make it educational and actionable.`
    }

    const response = await callGemini(apiKey, [{ text: fullPrompt }], type === 'complete' ? 4096 : 1500)
    if (!response.ok) {
      console.error('Gemini error status:', response.status)
      return NextResponse.json(
        { error: 'Failed to generate content. If this continues, set GEMINI_MODEL to a current Gemini model id.' },
        { status: 502, headers: noStore }
      )
    }

    const data = await response.json()
    const generatedText = textFrom(data)
    if (!generatedText) {
      return NextResponse.json({ error: 'No content generated' }, { status: 502, headers: noStore })
    }

    if (type === 'complete' || type === 'title') {
      const parsed = parseModelJson(generatedText) || {}
      const content = typeof parsed.content === 'string' ? sanitizeBlogHtml(parsed.content) : ''
      return NextResponse.json(
        {
          success: true,
          type,
          title: typeof parsed.title === 'string' ? parsed.title.slice(0, 180) : '',
          metaDescription: typeof parsed.metaDescription === 'string' ? parsed.metaDescription.slice(0, 160) : '',
          excerpt: typeof parsed.excerpt === 'string' ? parsed.excerpt.slice(0, 300) : '',
          keywords: typeof parsed.keywords === 'string' ? parsed.keywords.slice(0, 300) : '',
          content,
        },
        { headers: noStore }
      )
    }

    return NextResponse.json(
      { success: true, type, content: sanitizeBlogHtml(generatedText) },
      { headers: noStore }
    )
  } catch (error) {
    console.error('Error generating content:', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: noStore })
  }
}
