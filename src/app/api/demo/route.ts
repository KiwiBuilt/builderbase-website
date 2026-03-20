import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, company, email, phone, team_size, demo_interests, biggest_challenge } = body

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })

    // Email content
    const htmlContent = `
      <h2>New Demo Request - BUILDER BASE</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Company:</strong> ${company}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Team Size:</strong> ${team_size}</p>
      <p><strong>What to see in demo:</strong> ${demo_interests}</p>
      ${biggest_challenge ? `<p><strong>Biggest Challenge:</strong> ${biggest_challenge}</p>` : ''}
      <hr>
      <p><em>Submitted from builderbase.co.nz demo form</em></p>
    `

    // Send email
    await transporter.sendMail({
      from: process.env.GMAIL_EMAIL,
      to: 'office@builderbase.co.nz',
      subject: 'New Demo Request - BUILDER BASE',
      html: htmlContent,
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error sending demo email:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
