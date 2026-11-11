import { DEFAULT_AUTHOR, SITE_LOGO_URL, SITE_NAME, SITE_OG_IMAGE_URL, SITE_URL, absoluteUrl } from './site.ts'

export const BLOG_CATEGORIES = [
  'General',
  'Tips & Tricks',
  'Case Studies',
  'Updates',
  'Guides',
  'Industry News',
] as const

export type BlogCategory = (typeof BLOG_CATEGORIES)[number]

export type BlogFaq = {
  question: string
  answer: string
}

export type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  metaDescription: string
  keywords: string
  category: BlogCategory
  published: boolean
  featuredImage: string
  featuredImageAlt: string
  publishDate: string | null
  publishedAt: string | null
  updatedAt: string | null
  createdAt: string | null
  author: string
  faqs: BlogFaq[]
  slugLocked: boolean
  views: number
}

export type BlogWriteInput = {
  title: string
  slug: string
  excerpt: string
  content: string
  metaDescription: string
  keywords: string
  category: BlogCategory
  author: string
  publishDate: string | null
  featuredImage: string
  featuredImageAlt: string
  faqs: BlogFaq[]
  published: boolean
}

export type PublicComment = {
  id: string
  name: string
  content: string
  createdAt: string | null
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function slugify(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '')
}

export function slugForTitleChange(args: {
  previousTitle: string
  nextTitle: string
  currentSlug: string
  slugLocked: boolean
}): string {
  if (args.slugLocked) return args.currentSlug
  const previousAuto = slugify(args.previousTitle)
  const untouched = args.currentSlug.trim() === '' || args.currentSlug === previousAuto
  if (!untouched) return args.currentSlug
  return slugify(args.nextTitle)
}

export function htmlToText(html: string): string {
  return (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

export function toIsoDateTime(value: unknown): string | null {
  if (value == null || value === '') return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString()
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const iso = `${trimmed}T00:00:00.000Z`
      return Number.isNaN(new Date(iso).getTime()) ? null : iso
    }
    const date = new Date(trimmed)
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.toDate === 'function') {
      try {
        const date = (record.toDate as () => Date)()
        if (date instanceof Date && !Number.isNaN(date.getTime())) return date.toISOString()
      } catch {
        return null
      }
    }
    const seconds = record.seconds ?? record._seconds
    if (typeof seconds === 'number' && Number.isFinite(seconds)) {
      const nanosValue = record.nanoseconds ?? record._nanoseconds
      const nanos = typeof nanosValue === 'number' ? nanosValue : 0
      const date = new Date(seconds * 1000 + nanos / 1e6)
      return Number.isNaN(date.getTime()) ? null : date.toISOString()
    }
  }
  return null
}

export function formatNzDate(value: unknown): string | null {
  const iso = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())
    ? `${value.trim()}T00:00:00.000Z`
    : toIsoDateTime(value)
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-NZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Pacific/Auckland',
  }).format(date)
}

export function todayInAuckland(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Pacific/Auckland',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

export function postPublishedIso(post: {
  publishDate?: string | null
  publishedAt?: string | null
  createdAt?: string | null
}): string | null {
  if (post.publishDate && /^\d{4}-\d{2}-\d{2}$/.test(post.publishDate)) {
    return `${post.publishDate}T00:00:00.000Z`
  }
  return toIsoDateTime(post.publishedAt) || toIsoDateTime(post.createdAt)
}

export function postModifiedIso(post: {
  publishDate?: string | null
  publishedAt?: string | null
  updatedAt?: string | null
  createdAt?: string | null
}): string | null {
  return toIsoDateTime(post.updatedAt) || postPublishedIso(post)
}

function asString(value: unknown, max: number): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

function plainText(value: string, max: number): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
}

function isCategory(value: string): value is BlogCategory {
  return (BLOG_CATEGORIES as readonly string[]).includes(value)
}

function httpsUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:'
  } catch {
    return false
  }
}

function parsePublishDate(value: unknown): string | null | 'invalid' {
  if (value == null || value === '') return null
  if (typeof value !== 'string') return 'invalid'
  const trimmed = value.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return 'invalid'
  const [year, month, day] = trimmed.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return 'invalid'
  }
  return trimmed
}

function parseFaqs(value: unknown): BlogFaq[] | 'invalid' {
  if (value == null) return []
  if (!Array.isArray(value)) return 'invalid'
  if (value.length > 12) return 'invalid'
  const faqs: BlogFaq[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') return 'invalid'
    const record = item as Record<string, unknown>
    const question = plainText(typeof record.question === 'string' ? record.question : '', 200)
    const answer = plainText(typeof record.answer === 'string' ? record.answer : '', 2000)
    if (!question && !answer) continue
    if (!question || !answer) return 'invalid'
    faqs.push({ question, answer })
  }
  return faqs
}

export function validateBlogWrite(
  body: unknown,
  publishing: boolean
): { ok: true; value: BlogWriteInput } | { ok: false; error: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Post details are missing.' }
  }
  const record = body as Record<string, unknown>
  const title = asString(record.title, 180)
  if (!title) return { ok: false, error: 'A title is required.' }

  const slug = asString(record.slug, 80)
  if (!slug || !SLUG_PATTERN.test(slug)) {
    return { ok: false, error: 'Use a slug made of lowercase letters, numbers, and hyphens.' }
  }

  const categoryRaw = asString(record.category, 40) || 'General'
  if (!isCategory(categoryRaw)) {
    return { ok: false, error: 'Choose a category from the list.' }
  }

  const content = typeof record.content === 'string' ? record.content.slice(0, 200_000) : ''
  const metaDescription = asString(record.metaDescription, 160)
  if (publishing && !metaDescription) {
    return { ok: false, error: 'Add a meta description before publishing.' }
  }
  if (publishing && !htmlToText(content)) {
    return { ok: false, error: 'Write the post before publishing.' }
  }

  const featuredImage = asString(record.featuredImage, 2000)
  if (featuredImage && !httpsUrl(featuredImage)) {
    return { ok: false, error: 'The hero image must be an https URL.' }
  }
  const featuredImageAlt = asString(record.featuredImageAlt, 200)
  if (publishing && featuredImage && !featuredImageAlt) {
    return { ok: false, error: 'Add alt text for the hero image before publishing.' }
  }

  const publishDate = parsePublishDate(record.publishDate)
  if (publishDate === 'invalid') {
    return { ok: false, error: 'Publish date must be a real calendar date.' }
  }

  const faqs = parseFaqs(record.faqs)
  if (faqs === 'invalid') {
    return { ok: false, error: 'Each FAQ needs both a question and an answer.' }
  }

  const keywords = asString(
    Array.isArray(record.keywords) ? record.keywords.filter((item) => typeof item === 'string').join(', ') : record.keywords,
    300
  )

  return {
    ok: true,
    value: {
      title,
      slug,
      excerpt: asString(record.excerpt, 300),
      content,
      metaDescription,
      keywords,
      category: categoryRaw,
      author: asString(record.author, 80) || DEFAULT_AUTHOR,
      publishDate,
      featuredImage,
      featuredImageAlt,
      faqs,
      published: publishing,
    },
  }
}

export function serializeBlogPost(id: string, data: Record<string, unknown>): BlogPost | null {
  const title = asString(data.title, 180)
  const slug = asString(data.slug, 120)
  if (!title || !slug || slug.includes('/') || slug.includes('..')) return null
  const categoryRaw = asString(data.category, 40)
  const category: BlogCategory = isCategory(categoryRaw) ? categoryRaw : 'General'
  const faqs = parseFaqs(data.faqs)
  const publishDate = parsePublishDate(data.publishDate)
  const published = data.published === true
  return {
    id,
    title,
    slug,
    excerpt: asString(data.excerpt, 300),
    content: typeof data.content === 'string' ? data.content : '',
    metaDescription: asString(data.metaDescription, 160),
    keywords: asString(
      Array.isArray(data.keywords) ? data.keywords.filter((item) => typeof item === 'string').join(', ') : data.keywords,
      300
    ),
    category,
    published,
    featuredImage: asString(data.featuredImage, 2000),
    featuredImageAlt: asString(data.featuredImageAlt, 200),
    publishDate: publishDate === 'invalid' ? null : publishDate,
    publishedAt: toIsoDateTime(data.publishedAt),
    updatedAt: toIsoDateTime(data.updatedAt),
    createdAt: toIsoDateTime(data.createdAt),
    author: asString(data.author, 80) || DEFAULT_AUTHOR,
    faqs: faqs === 'invalid' ? [] : faqs,
    slugLocked: data.slugLocked === true || published,
    views: typeof data.views === 'number' && Number.isFinite(data.views) ? data.views : 0,
  }
}

export function validateCommentInput(body: unknown):
  | { ok: true; value: { blogId: string; name: string; email: string; content: string } }
  | { ok: false; error: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Comment details are missing.' }
  }
  const record = body as Record<string, unknown>
  const blogId = asString(record.blogId, 128)
  const name = plainText(typeof record.name === 'string' ? record.name : '', 120)
  const email = asString(record.email, 319)
  const content = plainText(typeof record.content === 'string' ? record.content : '', 4000)
  if (!blogId || !/^[A-Za-z0-9_-]+$/.test(blogId)) return { ok: false, error: 'That post could not be found.' }
  if (!name) return { ok: false, error: 'Name is required.' }
  if (email.length < 4 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'A valid email is required.' }
  }
  if (content.length < 10) return { ok: false, error: 'Comment must be at least 10 characters.' }
  return { ok: true, value: { blogId, name, email, content } }
}

export function serializePublicComment(id: string, data: Record<string, unknown>): PublicComment | null {
  if (data.approved !== true) return null
  const name = plainText(typeof data.name === 'string' ? data.name : '', 120)
  const content = plainText(typeof data.content === 'string' ? data.content : '', 4000)
  if (!name || !content) return null
  return { id, name, content, createdAt: toIsoDateTime(data.createdAt) }
}

function keywordList(keywords: string): string[] {
  return keywords
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .slice(0, 12)
}

export function buildPostMetadata(post: BlogPost) {
  const canonical = absoluteUrl(`/blog/${post.slug}`)
  const description = post.metaDescription || post.excerpt || htmlToText(post.content).slice(0, 160)
  const image = post.featuredImage || SITE_OG_IMAGE_URL
  const imageAlt = post.featuredImageAlt || post.title
  const publishedTime = postPublishedIso(post)
  const modifiedTime = postModifiedIso(post) || publishedTime
  return {
    title: `${post.title} | ${SITE_NAME}`,
    description,
    keywords: keywordList(post.keywords),
    alternates: { canonical },
    openGraph: {
      type: 'article' as const,
      url: canonical,
      title: post.title,
      description,
      siteName: SITE_NAME,
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
      images: [
        post.featuredImage
          ? { url: image, alt: imageAlt }
          : { url: image, width: 1200, height: 630, alt: imageAlt },
      ],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: post.title,
      description,
      images: [image],
    },
  }
}

function publisher() {
  return {
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: SITE_LOGO_URL,
    },
  }
}

export function buildBlogPosting(post: BlogPost) {
  const url = absoluteUrl(`/blog/${post.slug}`)
  const published = postPublishedIso(post)
  const modified = postModifiedIso(post)
  const authorName = post.author || DEFAULT_AUTHOR
  const author = /^builder\s*base$/i.test(authorName)
    ? { '@type': 'Organization', name: SITE_NAME, url: SITE_URL }
    : { '@type': 'Person', name: authorName }
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription || post.excerpt || htmlToText(post.content).slice(0, 160),
    image: [post.featuredImage || SITE_OG_IMAGE_URL],
    datePublished: published || undefined,
    dateModified: modified || published || undefined,
    author,
    publisher: publisher(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  }
}

export function buildBreadcrumbList(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function buildFaqPage(faqs: BlogFaq[]) {
  if (!faqs.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

export function buildBlogIndexSchema(posts: Array<{ title: string; slug: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${SITE_NAME} Blog`,
    url: absoluteUrl('/blog'),
    publisher: publisher(),
    blogPost: posts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: absoluteUrl(`/blog/${post.slug}`),
    })),
  }
}

export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
