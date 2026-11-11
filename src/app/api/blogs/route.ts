import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { deletePost, describeBlogAdminError, getPostById, listAllPosts, savePost } from '@/lib/blog-admin'
import { listPublishedPosts } from '@/lib/blog-public'
import { revalidateBlogPaths } from '@/lib/blog-revalidate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const noStore = { 'Cache-Control': 'no-store' }

function unauthorized() {
  return NextResponse.json({ error: 'Sign in to manage posts.' }, { status: 401, headers: noStore })
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const id = request.nextUrl.searchParams.get('id')
    if (session?.user) {
      if (id) {
        const post = await getPostById(id)
        if (!post) return NextResponse.json({ error: 'Blog not found' }, { status: 404, headers: noStore })
        return NextResponse.json(post, { headers: noStore })
      }
      const posts = await listAllPosts()
      return NextResponse.json(posts, { headers: noStore })
    }

    const posts = await listPublishedPosts()
    if (id) {
      const post = posts.find((entry) => entry.id === id) ?? null
      if (!post) return NextResponse.json({ error: 'Blog not found' }, { status: 404, headers: noStore })
      return NextResponse.json(post, { headers: noStore })
    }
    return NextResponse.json(posts, { headers: noStore })
  } catch (error) {
    const failure = describeBlogAdminError(error)
    return NextResponse.json(failure.body, { status: failure.status, headers: noStore })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    const body = await request.json()
    const publishing = body?.published === true
    const { post } = await savePost({
      authorId: session.user.id ?? null,
      body,
      publishing,
    })
    revalidateBlogPaths([post.slug])
    return NextResponse.json({ id: post.id, success: true, post }, { headers: noStore })
  } catch (error) {
    const failure = describeBlogAdminError(error)
    return NextResponse.json(failure.body, { status: failure.status, headers: noStore })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    const body = await request.json()
    const id = typeof body?.id === 'string' ? body.id : ''
    if (!id) {
      return NextResponse.json({ error: 'Blog ID required' }, { status: 400, headers: noStore })
    }
    const publishing = body?.published === true
    const { post, previousSlug } = await savePost({
      id,
      authorId: session.user.id ?? null,
      body,
      publishing,
    })
    revalidateBlogPaths([previousSlug, post.slug])
    return NextResponse.json({ success: true, post }, { headers: noStore })
  } catch (error) {
    const failure = describeBlogAdminError(error)
    return NextResponse.json(failure.body, { status: failure.status, headers: noStore })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    const id = request.nextUrl.searchParams.get('id') || ''
    if (!id) return NextResponse.json({ error: 'Blog ID required' }, { status: 400, headers: noStore })
    const slug = await deletePost(id)
    revalidateBlogPaths([slug])
    return NextResponse.json({ success: true }, { headers: noStore })
  } catch (error) {
    const failure = describeBlogAdminError(error)
    return NextResponse.json(failure.body, { status: failure.status, headers: noStore })
  }
}
