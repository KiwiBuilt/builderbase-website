import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { describeBlogAdminError } from '@/lib/blog-admin'
import { getAdminFirestore } from '@/lib/firebase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const noStore = { 'Cache-Control': 'no-store' }
const MAX_RULES = 10_000

function unauthorized() {
  return NextResponse.json({ error: 'Sign in to manage AI settings.' }, { status: 401, headers: noStore })
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    const snap = await getAdminFirestore().collection('settings').doc('aiRules').get()
    const rules = typeof snap.data()?.rules === 'string' ? snap.data()?.rules : ''
    return NextResponse.json({ rules }, { headers: noStore })
  } catch (error) {
    const failure = describeBlogAdminError(error, 'Could not save AI settings.')
    return NextResponse.json(failure.body, { status: failure.status, headers: noStore })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    const body = await request.json()
    const rules = typeof body?.rules === 'string' ? body.rules.slice(0, MAX_RULES) : ''
    await getAdminFirestore().collection('settings').doc('aiRules').set({
      rules,
      updatedAt: new Date().toISOString(),
    })
    return NextResponse.json({ success: true, rules }, { headers: noStore })
  } catch (error) {
    const failure = describeBlogAdminError(error, 'Could not save AI settings.')
    return NextResponse.json(failure.body, { status: failure.status, headers: noStore })
  }
}
