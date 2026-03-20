import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, company, email, phone, team_size, message, plan } = body

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
      <h2>New Trial Request - BUILDER BASE</h2>
      <p><strong>Plan:</strong> ${plan || 'Not specified'}</p>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Company:</strong> ${company}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Team Size:</strong> ${team_size}</p>
      ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
      <hr>
      <p><em>Submitted from builderbase.co.nz trial form</em></p>
    `

    // Send email
    await transporter.sendMail({
      from: process.env.GMAIL_EMAIL,
      to: 'office@builderbase.co.nz',
      subject: 'New Trial Request - BUILDER BASE',
      html: htmlContent,
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error sending trial email:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
