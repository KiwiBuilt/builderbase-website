import { cert, getApps, initializeApp, applicationDefault, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

export class FirebaseAdminConfigError extends Error {
  readonly code = 'admin_credentials_missing'
  constructor(message: string) {
    super(message)
    this.name = 'FirebaseAdminConfigError'
  }
}

const MISSING_CREDENTIALS =
  'Firebase Admin credentials are not configured, so leads cannot be listed yet. Set FIREBASE_SERVICE_ACCOUNT_JSON to the service account key as one line of JSON, or set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY. After the variables are saved, redeploy the site and refresh this page. No Firestore rules change is required. Public rules stay create-only, and this server key is what lets the admin page read websiteLeads.'

export type AdminCredential =
  | { type: 'cert'; projectId: string; clientEmail: string; privateKey: string }
  | { type: 'applicationDefault'; projectId?: string }

let cached: Firestore | null = null

function unwrapQuotes(value: string): string {
  const trimmed = value.trim().replace(/^\uFEFF/, '')
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim()
  }
  return trimmed
}

function normalizePrivateKey(value: string): string {
  return unwrapQuotes(value).replace(/\\n/g, '\n').trim()
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function parseServiceAccountJson(raw: string): { projectId: string; clientEmail: string; privateKey: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
    if (typeof parsed === 'string') parsed = JSON.parse(parsed)
  } catch {
    throw new FirebaseAdminConfigError(
      'FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON. Paste the downloaded service account key as a single-line JSON value. No Firestore rules change is required.'
    )
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new FirebaseAdminConfigError(
      'FIREBASE_SERVICE_ACCOUNT_JSON must be a JSON object with project_id, client_email, and private_key. No Firestore rules change is required.'
    )
  }
  const record = parsed as Record<string, unknown>
  const projectId = readString(record.project_id)
  const clientEmail = readString(record.client_email)
  const privateKey = normalizePrivateKey(readString(record.private_key))
  if (!projectId || !clientEmail || !privateKey.includes('PRIVATE KEY')) {
    throw new FirebaseAdminConfigError(
      'FIREBASE_SERVICE_ACCOUNT_JSON must include project_id, client_email, and private_key. No Firestore rules change is required.'
    )
  }
  return { projectId, clientEmail, privateKey }
}

export function loadFirebaseAdminCredential(): AdminCredential {
  const jsonRaw = unwrapQuotes(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '')
  if (jsonRaw) {
    const account = parseServiceAccountJson(jsonRaw)
    return { type: 'cert', ...account }
  }

  const explicitProject = (process.env.FIREBASE_PROJECT_ID || '').trim()
  const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').trim()
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY || ''
  if (explicitProject || clientEmail || privateKeyRaw.trim()) {
    const projectId = explicitProject || (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '').trim()
    const privateKey = normalizePrivateKey(privateKeyRaw)
    if (!projectId || !clientEmail || !privateKey) {
      throw new FirebaseAdminConfigError(
        'Firebase Admin needs FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY together, or FIREBASE_SERVICE_ACCOUNT_JSON instead. No Firestore rules change is required.'
      )
    }
    if (!privateKey.includes('PRIVATE KEY')) {
      throw new FirebaseAdminConfigError(
        'FIREBASE_PRIVATE_KEY must be the PEM private key from the service account, with newlines written as \\n. No Firestore rules change is required.'
      )
    }
    return { type: 'cert', projectId, clientEmail, privateKey }
  }

  const adc = (process.env.GOOGLE_APPLICATION_CREDENTIALS || '').trim()
  if (adc) {
    const projectId = (process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '').trim()
    return { type: 'applicationDefault', projectId: projectId || undefined }
  }

  throw new FirebaseAdminConfigError(MISSING_CREDENTIALS)
}

function ensureApp(credential: AdminCredential): App {
  const existing = getApps()[0]
  if (existing) return existing
  if (credential.type === 'applicationDefault') {
    return initializeApp({
      credential: applicationDefault(),
      projectId: credential.projectId,
    })
  }
  return initializeApp({
    credential: cert({
      projectId: credential.projectId,
      clientEmail: credential.clientEmail,
      privateKey: credential.privateKey,
    }),
    projectId: credential.projectId,
  })
}

export function getAdminFirestore(): Firestore {
  const credential = loadFirebaseAdminCredential()
  if (!cached) cached = getFirestore(ensureApp(credential))
  return cached
}
