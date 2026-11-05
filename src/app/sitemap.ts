import type { MetadataRoute } from 'next'

const BASE_URL = 'https://builderbase.co.nz'

const STATIC_PAGES: MetadataRoute.Sitemap = [
  {
    url: BASE_URL,
    changeFrequency: 'weekly',
    priority: 1,
  },
  {
    url: `${BASE_URL}/blog`,
    changeFrequency: 'weekly',
    priority: 0.8,
  },
]

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Sitemap lookup timed out')), ms)
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

function lastModifiedFrom(value: unknown): Date | undefined {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    try {
      const date = (value as { toDate: () => Date }).toDate()
      if (date instanceof Date && !Number.isNaN(date.getTime())) return date
    } catch {
      return undefined
    }
  }
  return undefined
}

async function loadPublishedPosts(): Promise<MetadataRoute.Sitemap> {
  const { db } = await import('@/lib/firebase')
  const { collection, getDocs, query, where } = await import('firebase/firestore')
  const snapshot = await getDocs(query(collection(db, 'blogs'), where('published', '==', true)))

  const posts: MetadataRoute.Sitemap = []
  for (const blog of snapshot.docs) {
    const data = blog.data()
    const slug = typeof data.slug === 'string' ? data.slug.trim() : ''
    if (!slug || slug.includes('/') || slug.includes('..')) continue
    const lastModified = lastModifiedFrom(data.updatedAt) || lastModifiedFrom(data.createdAt)
    posts.push({
      url: `${BASE_URL}/blog/${encodeURIComponent(slug)}`,
      changeFrequency: 'monthly',
      priority: 0.6,
      ...(lastModified ? { lastModified } : {}),
    })
  }
  return posts
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const posts = await withTimeout(loadPublishedPosts(), 4000)
    return [...STATIC_PAGES, ...posts]
  } catch (error) {
    console.error('Sitemap fell back to static pages:', error)
    return STATIC_PAGES
  }
}
