import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SiteFrame from '@/components/blog/SiteFrame'
import BlogComments from '@/components/blog/BlogComments'
import BlogViewTracker from '@/components/blog/BlogViewTracker'
import { getPublishedPostBySlug, listApprovedComments, listPublishedPosts } from '@/lib/blog-public'
import {
  buildBlogPosting,
  buildBreadcrumbList,
  buildFaqPage,
  buildPostMetadata,
  formatNzDate,
  jsonLd,
  postModifiedIso,
  postPublishedIso,
} from '@/lib/blog'
import { sanitizeBlogHtml } from '@/lib/blog-content'
import { SITE_NAME } from '@/lib/site'

export const revalidate = 3600
export const dynamicParams = true

type Props = { params: Promise<{ slug: string }> }

function readableSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug)
}

export async function generateStaticParams() {
  const posts = await listPublishedPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  if (!readableSlug(slug)) return { title: `Not found | ${SITE_NAME}`, robots: { index: false, follow: false } }
  const post = await getPublishedPostBySlug(slug)
  if (!post) return { title: `Not found | ${SITE_NAME}`, robots: { index: false, follow: false } }
  return buildPostMetadata(post)
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  if (!readableSlug(slug)) notFound()
  const post = await getPublishedPostBySlug(slug)
  if (!post) notFound()

  const comments = await listApprovedComments(post.id)
  const publishedIso = postPublishedIso(post)
  const modifiedIso = postModifiedIso(post)
  const publishedLabel = formatNzDate(publishedIso)
  const updatedLabel = formatNzDate(modifiedIso)
  const showUpdated = Boolean(publishedLabel && updatedLabel && publishedLabel !== updatedLabel)
  const faqs = buildFaqPage(post.faqs)
  const schema = [
    buildBlogPosting(post),
    buildBreadcrumbList([
      { name: 'Home', path: '/' },
      { name: 'Blog', path: '/blog' },
      { name: post.title, path: `/blog/${post.slug}` },
    ]),
    ...(faqs ? [faqs] : []),
  ]
  const content = sanitizeBlogHtml(post.content)

  return (
    <SiteFrame>
      <BlogViewTracker slug={post.slug} blogId={post.id} />
      <article className="bg-white">
        {post.featuredImage ? (
          <img
            src={post.featuredImage}
            alt={post.featuredImageAlt || post.title}
            className="h-72 w-full object-cover md:h-[420px]"
          />
        ) : null}
        <div className="mx-auto w-full max-w-3xl px-4 py-12">
          <nav className="mb-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-900">Home</Link>
            <span> / </span>
            <Link href="/blog" className="hover:text-gray-900">Blog</Link>
            <span> / </span>
            <span>{post.title}</span>
          </nav>
          <p className="mb-3 inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-900">
            {post.category}
          </p>
          <h1 className="text-4xl font-bold text-gray-900">{post.title}</h1>
          {post.excerpt ? <p className="mt-4 text-lg text-gray-600">{post.excerpt}</p> : null}
          <p className="mt-4 text-sm text-gray-500">
            <span>{post.author}</span>
            {publishedLabel ? (
              <>
                <span> · </span>
                <time dateTime={publishedIso || undefined}>Published {publishedLabel}</time>
              </>
            ) : null}
            {showUpdated ? (
              <>
                <span> · </span>
                <time dateTime={modifiedIso || undefined}>Updated {updatedLabel}</time>
              </>
            ) : null}
          </p>
          <div className="blog-content mt-8" dangerouslySetInnerHTML={{ __html: content }} />
          {post.faqs.length > 0 ? (
            <section className="mt-12 border-t border-gray-200 pt-8" id="faq">
              <h2 className="text-2xl font-bold text-gray-900">Frequently asked questions</h2>
              {post.faqs.map((faq) => (
                <div key={faq.question} className="mt-6">
                  <h3 className="text-xl font-semibold text-gray-900">{faq.question}</h3>
                  <p className="mt-2 text-gray-700">{faq.answer}</p>
                </div>
              ))}
            </section>
          ) : null}
        </div>
      </article>
      <BlogComments blogId={post.id} initialComments={comments} />
      {schema.map((entry) => (
        <script
          key={String((entry as { '@type'?: string })['@type'])}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(entry) }}
        />
      ))}
    </SiteFrame>
  )
}
