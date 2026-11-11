import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import { FirebaseAdminConfigError, loadFirebaseAdminCredential } from './firebase-admin.ts'
import { describeLeadsAdminError, redactErrorMessage } from './leads-admin.ts'
import { LeadNotFoundError, LeadUpdateError } from './lead-records.ts'

const KEYS = [
  'FIREBASE_SERVICE_ACCOUNT_JSON',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'GOOGLE_APPLICATION_CREDENTIALS',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
] as const

const previous = new Map(KEYS.map((key) => [key, process.env[key]]))

function useEnv(values: Partial<Record<(typeof KEYS)[number], string>>) {
  for (const key of KEYS) delete process.env[key]
  for (const [key, value] of Object.entries(values)) process.env[key] = value
}

afterEach(() => {
  for (const [key, value] of previous) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

describe('firebase admin credentials', () => {
  it('explains a missing server key without asking for a rules change', () => {
    useEnv({})
    assert.throws(() => loadFirebaseAdminCredential(), (error: unknown) => {
      assert.ok(error instanceof FirebaseAdminConfigError)
      assert.match(error.message, /FIREBASE_SERVICE_ACCOUNT_JSON/)
      assert.match(error.message, /No Firestore rules change is required/)
      return true
    })
    const failure = describeLeadsAdminError(new FirebaseAdminConfigError('Missing admin key. No Firestore rules change is required.'))
    assert.equal(failure.status, 503)
    assert.equal(failure.body.code, 'admin_credentials_missing')
  })

  it('reads a one-line service account and split PEM keys', () => {
    useEnv({
      FIREBASE_SERVICE_ACCOUNT_JSON: JSON.stringify({
        project_id: 'builderbase-demo',
        client_email: 'admin@builderbase-demo.iam.gserviceaccount.com',
        private_key: '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n',
      }),
    })
    const fromJson = loadFirebaseAdminCredential()
    assert.equal(fromJson.type, 'cert')
    if (fromJson.type !== 'cert') return
    assert.equal(fromJson.projectId, 'builderbase-demo')
    assert.equal(fromJson.privateKey.includes('BEGIN PRIVATE KEY'), true)
    assert.equal(fromJson.privateKey.includes('\nabc\n'), true)

    useEnv({
      FIREBASE_CLIENT_EMAIL: 'admin@builderbase-demo.iam.gserviceaccount.com',
      FIREBASE_PRIVATE_KEY: '"-----BEGIN PRIVATE KEY-----\\nline\\n-----END PRIVATE KEY-----\\n"',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'public-project',
    })
    const fromParts = loadFirebaseAdminCredential()
    assert.equal(fromParts.type, 'cert')
    if (fromParts.type !== 'cert') return
    assert.equal(fromParts.projectId, 'public-project')
    assert.equal(fromParts.privateKey.includes('\nline\n'), true)
  })

  it('rejects a partial or invalid key', () => {
    useEnv({ FIREBASE_SERVICE_ACCOUNT_JSON: '{not json' })
    assert.throws(() => loadFirebaseAdminCredential(), /not valid JSON/)
    useEnv({ FIREBASE_CLIENT_EMAIL: 'admin@builderbase-demo.iam.gserviceaccount.com' })
    assert.throws(() => loadFirebaseAdminCredential(), /FIREBASE_PROJECT_ID/)
  })

  it('maps not-found and bad updates, and redacts private keys', () => {
    assert.equal(describeLeadsAdminError(new LeadNotFoundError()).status, 404)
    assert.equal(describeLeadsAdminError(new LeadUpdateError('Write a note before saving.')).status, 400)
    const leaked = new Error('bad -----BEGIN PRIVATE KEY-----\nsecret\n-----END PRIVATE KEY-----')
    assert.equal(redactErrorMessage(leaked).includes('secret'), false)
    const failure = describeLeadsAdminError(leaked)
    assert.equal(failure.status, 500)
    assert.equal(JSON.stringify(failure).includes('secret'), false)
    const credential = describeLeadsAdminError(new Error('invalid_grant from the credential'))
    assert.equal(credential.status, 503)
    assert.match(credential.body.error, /No Firestore rules change is required/)
  })
})
