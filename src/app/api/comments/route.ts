import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/firebase'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'

// Get comments for a blog or all pending comments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const blogId = searchParams.get('blogId')
    const pendingOnly = searchParams.get('pending')
    const session = await getServerSession(authOptions)

    if (!session && pendingOnly) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const commentsRef = collection(db, 'comments')
    let q

    if (blogId && !pendingOnly) {
      // Get published comments for a blog
      q = query(commentsRef, where('blogId', '==', blogId), where('approved', '==', true))
    } else if (pendingOnly) {
      // Get pending comments for admin
      q = query(commentsRef, where('approved', '==', false))
    } else {
      // Get all comments for admin
      q = query(commentsRef)
    }

    const commentsSnapshot = await getDocs(q)
    const comments = commentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Record<string, any>),
    }))

    return NextResponse.json(comments)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Create a new comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { blogId, name, email, content } = body

    if (!blogId || !name || !email || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const commentsRef = collection(db, 'comments')
    const docRef = await addDoc(commentsRef, {
      blogId,
      name,
      email,
      content,
      approved: false,
      createdAt: serverTimestamp(),
    })

    return NextResponse.json({ id: docRef.id, success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Approve or reject a comment
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, approved } = body

    if (!id) {
      return NextResponse.json({ error: 'Comment ID required' }, { status: 400 })
    }

    const commentRef = doc(db, 'comments', id)
    await updateDoc(commentRef, { approved })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Delete a comment
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Comment ID required' }, { status: 400 })
    }

    const commentRef = doc(db, 'comments', id)
    await deleteDoc(commentRef)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
