import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

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
                  text: `You are a professional blog writer for a construction management software company (Builder Base). 
Write professional, engaging blog content based on this prompt: "${prompt}"

Guidelines:
- Write in clear, professional language suitable for builders and construction managers
- Use short paragraphs (2-3 sentences max)
- Include practical tips and actionable advice
- Format as HTML with <h2>, <h3>, <p>, <ul>, <li> tags
- Keep content between 300-800 words
- Make it SEO-friendly and engaging

Content:`,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 1000,
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

    // Extract the generated text
    const generatedText =
      data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    if (!generatedText) {
      return NextResponse.json(
        { error: 'No content generated' },
        { status: 500 }
      )
    }

    // Clean up the response - remove markdown code block markers if present
    const cleanContent = generatedText
      .replace(/^```html\n?/, '')
      .replace(/\n?```$/, '')
      .trim()

    return NextResponse.json({
      success: true,
      content: cleanContent,
    })
  } catch (error: any) {
    console.error('Content generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate content' },
      { status: 500 }
    )
  }
}
