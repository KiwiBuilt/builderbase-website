import { randomUUID } from 'crypto'
import { loadFirebaseAdminCredential } from './firebase-admin.ts'
import { BlogWriteError } from './blog-admin.ts'

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
const MAX_BYTES = 10 * 1024 * 1024

export type GalleryImage = {
  name: string
  url: string
}

function bucketName(): string {
  const raw = (process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '').trim()
  const name = raw.replace(/^gs:\/\//, '').replace(/\/$/, '')
  if (!name) {
    throw new BlogWriteError(
      'Image uploads need NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET (or FIREBASE_STORAGE_BUCKET) plus the Firebase Admin service account. Publish storage.rules in the Firebase console so the public site can read blog images and visitors cannot upload or delete them.',
      503,
      'storage_bucket_missing'
    )
  }
  return name
}

async function bucket() {
  const { getStorage } = await import('firebase-admin/storage')
  const { cert, getApps, initializeApp, applicationDefault } = await import('firebase-admin/app')
  const credential = loadFirebaseAdminCredential()
  const existing = getApps()[0]
  const app =
    existing ||
    (credential.type === 'applicationDefault'
      ? initializeApp({ credential: applicationDefault(), projectId: credential.projectId, storageBucket: bucketName() })
      : initializeApp({
          credential: cert({
            projectId: credential.projectId,
            clientEmail: credential.clientEmail,
            privateKey: credential.privateKey,
          }),
          projectId: credential.projectId,
          storageBucket: bucketName(),
        }))
  return getStorage(app).bucket(bucketName())
}

function downloadUrl(name: string, bucketId: string, token: string): string {
  const base = `https://firebasestorage.googleapis.com/v0/b/${bucketId}/o/${encodeURIComponent(name)}?alt=media`
  return token ? `${base}&token=${token}` : base
}

function tokenFrom(metadata: { metadata?: Record<string, unknown> } | undefined): string {
  const raw = metadata?.metadata?.firebaseStorageDownloadTokens
  if (typeof raw !== 'string') return ''
  return raw.split(',')[0]?.trim() || ''
}

export function safeImageName(filename: string): string {
  const base = (filename.split(/[/\\]/).pop() || 'image').toLowerCase()
  const cleaned = base.replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'image'
  return `${Date.now()}-${randomUUID().slice(0, 8)}-${cleaned}`
}

export async function listGalleryImages(): Promise<GalleryImage[]> {
  const store = await bucket()
  const [files] = await store.getFiles({ prefix: 'blog-images/' })
  return files
    .filter((file) => file.name && !file.name.endsWith('/'))
    .map((file) => {
      const name = file.name.split('/').pop() || file.name
      return {
        name,
        url: downloadUrl(file.name, store.name, tokenFrom(file.metadata)),
      }
    })
    .sort((a, b) => b.name.localeCompare(a.name))
}

export async function uploadGalleryImage(file: { name: string; type: string; bytes: Buffer }): Promise<GalleryImage> {
  if (!IMAGE_TYPES.has(file.type)) {
    throw new BlogWriteError('Upload a JPEG, PNG, GIF, or WebP image.')
  }
  if (file.bytes.length > MAX_BYTES) {
    throw new BlogWriteError('Image must be less than 10MB.')
  }
  const store = await bucket()
  const name = safeImageName(file.name)
  const path = `blog-images/${name}`
  const token = randomUUID()
  await store.file(path).save(file.bytes, {
    resumable: false,
    metadata: {
      contentType: file.type,
      metadata: { firebaseStorageDownloadTokens: token },
    },
  })
  return { name, url: downloadUrl(path, store.name, token) }
}

export async function deleteGalleryImage(name: string): Promise<void> {
  if (!name || !/^[\w.-]+$/.test(name) || name.includes('..')) {
    throw new BlogWriteError('That image name is not valid.')
  }
  const store = await bucket()
  await store.file(`blog-images/${name}`).delete({ ignoreNotFound: true })
}
