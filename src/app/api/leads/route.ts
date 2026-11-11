import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { describeLeadsAdminError, listWebsiteLeads, updateWebsiteLead } from '@/lib/leads-admin'
import { summarizeLeads } from '@/lib/lead-records'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const noStore = { 'Cache-Control': 'no-store' }

function unauthorized(message: string) {
  return NextResponse.json({ error: message }, { status: 401, headers: noStore })
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized('Sign in to view leads.')

    const leads = await listWebsiteLeads()
    if (request.nextUrl.searchParams.get('summary') === '1') {
      return NextResponse.json(summarizeLeads(leads), { headers: noStore })
    }
    return NextResponse.json({ leads }, { headers: noStore })
  } catch (error) {
    const failure = describeLeadsAdminError(error)
    return NextResponse.json(failure.body, { status: failure.status, headers: noStore })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized('Sign in to update leads.')

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400, headers: noStore })
    }

    const id =
      body && typeof body === 'object' && !Array.isArray(body) && typeof (body as { id?: unknown }).id === 'string'
        ? (body as { id: string }).id
        : ''

    const lead = await updateWebsiteLead(id, body, {
      name: session.user.name ?? null,
      email: session.user.email ?? null,
    })
    return NextResponse.json({ lead }, { headers: noStore })
  } catch (error) {
    const failure = describeLeadsAdminError(error)
    return NextResponse.json(failure.body, { status: failure.status, headers: noStore })
  }
}
