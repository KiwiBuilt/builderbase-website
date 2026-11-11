import type { MetadataRoute } from 'next'
import { listPublishedPosts } from '@/lib/blog-public'
import { postModifiedIso } from '@/lib/blog'
import { SITE_URL } from '@/lib/site'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/blog`, changeFrequency: 'weekly', priority: 0.8 },
  ]
  try {
    const posts = await listPublishedPosts()
    const entries = posts.map((post) => {
      const modified = postModifiedIso(post)
      return {
        url: `${SITE_URL}/blog/${post.slug}`,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
        ...(modified ? { lastModified: new Date(modified) } : {}),
      }
    })
    return [...staticPages, ...entries]
  } catch (error) {
    console.error('Sitemap fell back to static pages:', error)
    return staticPages
  }
}
