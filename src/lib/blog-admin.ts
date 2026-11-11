import { FieldValue } from 'firebase-admin/firestore'
import { FirebaseAdminConfigError, getAdminFirestore } from './firebase-admin.ts'
import { sanitizeBlogHtml } from './blog-content.ts'
import {
  htmlToText,
  serializeBlogPost,
  todayInAuckland,
  toIsoDateTime,
  validateBlogWrite,
  type BlogPost,
} from './blog.ts'
import { redactErrorMessage } from './leads-admin.ts'

export class BlogWriteError extends Error {
  readonly status: number
  readonly code: string
  constructor(message: string, status = 400, code = 'invalid_post') {
    super(message)
    this.name = 'BlogWriteError'
    this.status = status
    this.code = code
  }
}

function assertDocId(id: string) {
  if (!id || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
    throw new BlogWriteError('That post id is not valid.', 400, 'invalid_id')
  }
}

export async function listAllPosts(): Promise<BlogPost[]> {
  const snap = await getAdminFirestore().collection('blogs').get()
  return snap.docs
    .map((entry) => serializeBlogPost(entry.id, entry.data() as Record<string, unknown>))
    .filter((post): post is BlogPost => post !== null)
    .sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''))
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  assertDocId(id)
  const snap = await getAdminFirestore().collection('blogs').doc(id).get()
  if (!snap.exists) return null
  return serializeBlogPost(snap.id, (snap.data() || {}) as Record<string, unknown>)
}

export async function savePost(args: {
  id?: string
  authorId?: string | null
  body: unknown
  publishing: boolean
}): Promise<{ post: BlogPost; previousSlug: string | null }> {
  const parsed = validateBlogWrite(args.body, args.publishing)
  if (parsed.ok === false) throw new BlogWriteError(parsed.error)
  const value = parsed.value
  value.content = sanitizeBlogHtml(value.content)
  if (args.publishing && !htmlToText(value.content)) {
    throw new BlogWriteError('Write the post before publishing.')
  }
  if (!value.publishDate && args.publishing) {
    value.publishDate = todayInAuckland()
  }

  const db = getAdminFirestore()
  const id = args.id?.trim() || ''
  if (id) assertDocId(id)
  const ref = id ? db.collection('blogs').doc(id) : db.collection('blogs').doc()

  const existing = id ? await ref.get() : null
  if (id && !existing?.exists) throw new BlogWriteError('That post could not be found.', 404, 'not_found')
  const previous = (existing?.data() || {}) as Record<string, unknown>
  const previousSlug = typeof previous.slug === 'string' ? previous.slug : null
  const locked = previous.slugLocked === true || previous.published === true
  if (locked && previousSlug && value.slug !== previousSlug) {
    throw new BlogWriteError('This post is already published, so its URL is locked.', 400, 'slug_locked')
  }

  const duplicates = await db.collection('blogs').where('slug', '==', value.slug).get()
  if (duplicates.docs.some((entry) => entry.id !== ref.id)) {
    throw new BlogWriteError('Another post already uses that URL slug.', 409, 'duplicate_slug')
  }

  const slugLocked = locked || value.published
  const payload: Record<string, unknown> = {
    title: value.title,
    slug: value.slug,
    excerpt: value.excerpt,
    content: value.content,
    metaDescription: value.metaDescription,
    keywords: value.keywords,
    category: value.category,
    author: value.author,
    publishDate: value.publishDate,
    featuredImage: value.featuredImage,
    featuredImageAlt: value.featuredImageAlt,
    faqs: value.faqs,
    published: value.published,
    slugLocked,
    updatedAt: FieldValue.serverTimestamp(),
  }

  if (!existing?.exists) {
    payload.createdAt = FieldValue.serverTimestamp()
    payload.views = 0
    payload.authorId = args.authorId || null
    payload.publishedAt = value.published ? FieldValue.serverTimestamp() : null
    await ref.set(payload)
  } else {
    if (value.published && !previous.publishedAt) {
      payload.publishedAt = FieldValue.serverTimestamp()
    }
    await ref.update(payload)
  }

  const fresh = await ref.get()
  const post = serializeBlogPost(fresh.id, (fresh.data() || {}) as Record<string, unknown>)
  if (!post) throw new BlogWriteError('The post could not be saved.', 500, 'save_failed')
  return { post, previousSlug }
}

export async function deletePost(id: string): Promise<string | null> {
  assertDocId(id)
  const ref = getAdminFirestore().collection('blogs').doc(id)
  const existing = await ref.get()
  if (!existing.exists) throw new BlogWriteError('That post could not be found.', 404, 'not_found')
  const slug = typeof existing.data()?.slug === 'string' ? existing.data()?.slug : null
  await ref.delete()
  return slug
}

export async function listCommentsForAdmin(filter: {
  blogId?: string | null
  approved?: boolean | null
}): Promise<Array<Record<string, unknown>>> {
  const snap = await getAdminFirestore().collection('comments').get()
  return snap.docs
    .map((entry) => {
      const data = entry.data() as Record<string, unknown>
      return {
        id: entry.id,
        blogId: typeof data.blogId === 'string' ? data.blogId : '',
        name: typeof data.name === 'string' ? data.name : '',
        email: typeof data.email === 'string' ? data.email : '',
        content: typeof data.content === 'string' ? data.content : '',
        approved: data.approved === true,
        createdAt: toIsoDateTime(data.createdAt),
      }
    })
    .filter((comment) => {
      if (filter.blogId && comment.blogId !== filter.blogId) return false
      if (typeof filter.approved === 'boolean' && comment.approved !== filter.approved) return false
      return true
    })
}

export async function setCommentApproval(id: string, approved: boolean): Promise<void> {
  assertDocId(id)
  const ref = getAdminFirestore().collection('comments').doc(id)
  const existing = await ref.get()
  if (!existing.exists) throw new BlogWriteError('That comment could not be found.', 404, 'not_found')
  await ref.update({ approved })
}

export async function deleteComment(id: string): Promise<void> {
  assertDocId(id)
  const ref = getAdminFirestore().collection('comments').doc(id)
  const existing = await ref.get()
  if (!existing.exists) throw new BlogWriteError('That comment could not be found.', 404, 'not_found')
  await ref.delete()
}

export function describeBlogAdminError(
  error: unknown,
  fallback = 'Could not save the blog post.'
): { status: number; body: { error: string; code: string } } {
  if (error instanceof FirebaseAdminConfigError) {
    return {
      status: 503,
      body: {
        error:
          'Saving the blog needs the Firebase Admin service account already used by the Leads page. Set FIREBASE_SERVICE_ACCOUNT_JSON, or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY, then redeploy. Public pages can still read published posts without it. After this change is deployed, also publish firestore.rules and storage.rules in the Firebase console.',
        code: 'admin_credentials_missing',
      },
    }
  }
  if (error instanceof BlogWriteError) {
    return { status: error.status, body: { error: error.message, code: error.code } }
  }
  const detail = redactErrorMessage(error)
  console.error('blog admin error:', detail)
  if (/credential|permission-denied|unauthenticated|invalid_grant|ENOENT|project id|private key/i.test(detail)) {
    return {
      status: 503,
      body: {
        error: `Firebase Admin could not access the blog (${detail}). Check the service account, then publish firestore.rules and storage.rules in the Firebase console.`,
        code: 'admin_credentials_invalid',
      },
    }
  }
  return { status: 500, body: { error: fallback, code: 'blog_unavailable' } }
}
