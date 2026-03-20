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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const session = await getServerSession(authOptions)
    const blogsRef = collection(db, 'blogs')

    // If specific blog ID requested
    if (id) {
      const blogDoc = await getDocs(query(blogsRef, where('__name__', '==', id)))
      if (blogDoc.empty) {
        return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
      }
      const blog = blogDoc.docs[0]
      // If not published and not authenticated, deny access
      if (!session && !blog.data().published) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.json([{ id: blog.id, ...blog.data() }])
    }

    // Get all blogs (filtered based on auth status)
    let blogsSnapshot

    // If authenticated (admin), return all blogs
    // If not authenticated (public), return only published blogs
    if (session) {
      blogsSnapshot = await getDocs(blogsRef)
    } else {
      const q = query(blogsRef, where('published', '==', true))
      blogsSnapshot = await getDocs(q)
    }

    const blogs = blogsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json(blogs)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, slug, content, excerpt, metaDescription, keywords, published, featuredImage } = body

    if (!title || !slug || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const blogsRef = collection(db, 'blogs')
    const docRef = await addDoc(blogsRef, {
      title,
      slug,
      content,
      excerpt,
      metaDescription,
      keywords,
      published: published || false,
      featuredImage: featuredImage || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      views: 0,
      authorId: session.user?.id,
    })

    return NextResponse.json({ id: docRef.id, success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, title, slug, content, excerpt, metaDescription, keywords, published, featuredImage } = body

    if (!id) {
      return NextResponse.json({ error: 'Blog ID required' }, { status: 400 })
    }

    const blogRef = doc(db, 'blogs', id)
    await updateDoc(blogRef, {
      title,
      slug,
      content,
      excerpt,
      metaDescription,
      keywords,
      published,
      featuredImage,
      updatedAt: serverTimestamp(),
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Blog ID required' }, { status: 400 })
    }

    const blogRef = doc(db, 'blogs', id)
    await deleteDoc(blogRef)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
