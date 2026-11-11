import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/firebase'
import { validateCommentInput } from '@/lib/blog'
import { listApprovedComments } from '@/lib/blog-public'
import { deleteComment, describeBlogAdminError, listCommentsForAdmin, setCommentApproval } from '@/lib/blog-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const noStore = { 'Cache-Control': 'no-store' }

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const blogId = request.nextUrl.searchParams.get('blogId')
    const pending = request.nextUrl.searchParams.get('pending') === 'true'
    const approvedParam = request.nextUrl.searchParams.get('approved')

    if (!session?.user) {
      if (!blogId || pending || approvedParam) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStore })
      }
      const comments = await listApprovedComments(blogId)
      return NextResponse.json(comments, { headers: noStore })
    }

    let approved: boolean | null = null
    if (pending) approved = false
    else if (approvedParam === 'true') approved = true
    else if (approvedParam === 'false') approved = false

    const comments = await listCommentsForAdmin({ blogId, approved })
    return NextResponse.json(comments, { headers: noStore })
  } catch (error) {
    const failure = describeBlogAdminError(error)
    return NextResponse.json(failure.body, { status: failure.status, headers: noStore })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = validateCommentInput(body)
    if (parsed.ok === false) return NextResponse.json({ error: parsed.error }, { status: 400, headers: noStore })

    const docRef = await addDoc(collection(db, 'comments'), {
      blogId: parsed.value.blogId,
      name: parsed.value.name,
      email: parsed.value.email,
      content: parsed.value.content,
      approved: false,
      createdAt: serverTimestamp(),
    })
    return NextResponse.json({ id: docRef.id, success: true }, { headers: noStore })
  } catch (error) {
    console.error('Comment create failed:', error)
    return NextResponse.json({ error: 'Could not save that comment.' }, { status: 500, headers: noStore })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStore })
    const body = await request.json()
    const id = typeof body?.id === 'string' ? body.id : ''
    if (!id) return NextResponse.json({ error: 'Comment ID required' }, { status: 400, headers: noStore })
    await setCommentApproval(id, body?.approved === true)
    return NextResponse.json({ success: true }, { headers: noStore })
  } catch (error) {
    const failure = describeBlogAdminError(error)
    return NextResponse.json(failure.body, { status: failure.status, headers: noStore })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStore })
    let id = request.nextUrl.searchParams.get('id') || ''
    if (!id) {
      try {
        const body = await request.json()
        if (typeof body?.id === 'string') id = body.id
      } catch {
        id = ''
      }
    }
    if (!id) return NextResponse.json({ error: 'Comment ID required' }, { status: 400, headers: noStore })
    await deleteComment(id)
    return NextResponse.json({ success: true }, { headers: noStore })
  } catch (error) {
    const failure = describeBlogAdminError(error)
    return NextResponse.json(failure.body, { status: failure.status, headers: noStore })
  }
}
