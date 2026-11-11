import { revalidatePath } from 'next/cache'

export function revalidateBlogPaths(slugs: Array<string | null | undefined>) {
  revalidatePath('/blog')
  revalidatePath('/sitemap.xml')
  revalidatePath('/llms.txt')
  const unique = new Set(slugs.filter((slug): slug is string => typeof slug === 'string' && slug.length > 0))
  for (const slug of unique) {
    revalidatePath(`/blog/${slug}`)
  }
}
