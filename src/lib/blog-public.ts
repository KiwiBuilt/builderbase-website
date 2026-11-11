import { cache } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from './firebase'
import {
  postPublishedIso,
  serializeBlogPost,
  serializePublicComment,
  type BlogPost,
  type PublicComment,
} from './blog.ts'

const LOOKUP_TIMEOUT_MS = 4000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Blog lookup timed out')), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })
}

export const listPublishedPosts = cache(async (): Promise<BlogPost[]> => {
  try {
    const snap = await withTimeout(
      getDocs(query(collection(db, 'blogs'), where('published', '==', true))),
      LOOKUP_TIMEOUT_MS
    )
    const posts = snap.docs
      .map((entry) => serializeBlogPost(entry.id, entry.data() as Record<string, unknown>))
      .filter((post): post is BlogPost => Boolean(post && post.published))
    posts.sort((a, b) => (postPublishedIso(b) || '').localeCompare(postPublishedIso(a) || ''))
    return posts
  } catch (error) {
    console.error('Published blog lookup failed:', error)
    return []
  }
})

export const getPublishedPostBySlug = cache(async (slug: string): Promise<BlogPost | null> => {
  const posts = await listPublishedPosts()
  return posts.find((post) => post.slug === slug) ?? null
})

export async function listApprovedComments(blogId: string): Promise<PublicComment[]> {
  try {
    const snap = await withTimeout(
      getDocs(query(collection(db, 'comments'), where('approved', '==', true))),
      LOOKUP_TIMEOUT_MS
    )
    return snap.docs
      .filter((entry) => entry.data().blogId === blogId)
      .map((entry) => serializePublicComment(entry.id, entry.data() as Record<string, unknown>))
      .filter((comment): comment is PublicComment => comment !== null)
  } catch (error) {
    console.error('Approved comment lookup failed:', error)
    return []
  }
}
