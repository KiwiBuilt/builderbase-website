import type { Metadata } from 'next'
import Link from 'next/link'
import SiteFrame from '@/components/blog/SiteFrame'
import BlogBrowser from '@/components/blog/BlogBrowser'
import { listPublishedPosts } from '@/lib/blog-public'
import { buildBlogIndexSchema, buildBreadcrumbList, formatNzDate, jsonLd, postPublishedIso } from '@/lib/blog'
import { SITE_NAME, SITE_OG_IMAGE_URL, SITE_URL } from '@/lib/site'

export const revalidate = 3600

const description = 'Tips, tricks, and insights for construction management in New Zealand.'

export const metadata: Metadata = {
  title: `Blog | ${SITE_NAME}`,
  description,
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/blog`,
    title: `Blog | ${SITE_NAME}`,
    description,
    siteName: SITE_NAME,
    images: [{ url: SITE_OG_IMAGE_URL, width: 1200, height: 630, alt: `${SITE_NAME} blog` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Blog | ${SITE_NAME}`,
    description,
    images: [SITE_OG_IMAGE_URL],
  },
}

export default async function BlogPage() {
  const posts = await listPublishedPosts()
  const cards = posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || post.metaDescription,
    category: post.category,
    featuredImage: post.featuredImage,
    featuredImageAlt: post.featuredImageAlt || post.title,
    publishedLabel: formatNzDate(postPublishedIso(post)),
    publishedIso: postPublishedIso(post),
  }))
  const schema = [buildBlogIndexSchema(posts), buildBreadcrumbList([
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
  ])]

  return (
    <SiteFrame>
      <div className="border-b border-gray-200 bg-white">
        <div className="container-custom py-12">
          <nav className="mb-4 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-900">Home</Link>
            <span> / </span>
            <span>Blog</span>
          </nav>
          <h1 className="text-4xl font-bold text-gray-900">Blog</h1>
          <p className="mt-2 text-lg text-gray-600">{description}</p>
        </div>
      </div>
      <div className="container-custom py-12">
        <BlogBrowser posts={cards} />
      </div>
      {schema.map((entry) => (
        <script key={entry['@type'] as string} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(entry) }} />
      ))}
    </SiteFrame>
  )
}
