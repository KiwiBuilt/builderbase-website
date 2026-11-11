import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { deliverLead, escapeHtml, stringField, utmField } from '@/lib/leads'

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    const parsed = await request.json()
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    body = parsed as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const name = stringField(body.name, 200)
  const email = stringField(body.email, 320)
  const phone = stringField(body.phone, 50)
  const company = stringField(body.company, 200)
  const interests = stringField(body.demo_interests)
  const challenge = stringField(body.biggest_challenge)
  const source = stringField(body.source, 500)
  const teamSize = stringField(body.team_size, 50)
  const utm = utmField(body.utm)
  const message = [interests, challenge ? `Biggest challenge: ${challenge}` : '']
    .filter(Boolean)
    .join('\n\n')

  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
  }

  const result = await deliverLead({
    lead: {
      type: 'demo',
      name,
      email,
      phone,
      company,
      message,
      plan: '',
      source,
      utm,
      teamSize,
    },
    sendEmail: async () => {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        auth: {
          user: process.env.GMAIL_EMAIL,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      })

      const htmlContent = `
        <h2>New Demo Request - BUILDER BASE</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Company:</strong> ${escapeHtml(company)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
        <p><strong>Team Size:</strong> ${escapeHtml(teamSize)}</p>
        <p><strong>What to see in demo:</strong> ${escapeHtml(interests)}</p>
        ${challenge ? `<p><strong>Biggest Challenge:</strong> ${escapeHtml(challenge)}</p>` : ''}
        ${source ? `<p><strong>Source:</strong> ${escapeHtml(source)}</p>` : ''}
        <hr>
        <p><em>Submitted from builderbase.co.nz demo form</em></p>
      `

      await transporter.sendMail({
        from: process.env.GMAIL_EMAIL,
        to: 'office@builderbase.co.nz',
        subject: 'New Demo Request - BUILDER BASE',
        html: htmlContent,
      })
    },
  })

  if (!result.ok) {
    return NextResponse.json(
      { error: 'Failed to save demo request' },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { success: true, saved: result.saved, emailed: result.emailed },
    { status: 200 }
  )
}
