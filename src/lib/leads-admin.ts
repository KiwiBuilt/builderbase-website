import { FieldValue } from 'firebase-admin/firestore'
import { FirebaseAdminConfigError, getAdminFirestore } from './firebase-admin.ts'
import {
  LeadNotFoundError,
  LeadUpdateError,
  compareLeadsNewestFirst,
  isLeadDocumentId,
  planLeadPatch,
  serializeWebsiteLead,
  type AdminLead,
} from './lead-records.ts'

export type LeadActor = {
  name: string | null
  email: string | null
}

export async function listWebsiteLeads(): Promise<AdminLead[]> {
  const db = getAdminFirestore()
  const snap = await db.collection('websiteLeads').get()
  return snap.docs
    .map((doc) => serializeWebsiteLead(doc.id, doc.data() as Record<string, unknown>))
    .sort(compareLeadsNewestFirst)
}

export async function updateWebsiteLead(id: string, body: unknown, actor: LeadActor): Promise<AdminLead> {
  if (!isLeadDocumentId(id)) {
    throw new LeadUpdateError('That lead id is not valid.')
  }

  const db = getAdminFirestore()
  const ref = db.collection('websiteLeads').doc(id)

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists) throw new LeadNotFoundError()
    const data = (snap.data() || {}) as Record<string, unknown>
    const plan = planLeadPatch(data, body, {
      nowIso: new Date().toISOString(),
      noteId: crypto.randomUUID(),
      authorName: actor.name,
      authorEmail: actor.email,
    })
    if (plan.ok === false) throw new LeadUpdateError(plan.error)
    if (plan.unchanged === true) return

    const update: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    }
    if (plan.status) {
      update.status = plan.status
      update.statusChangedAt = FieldValue.serverTimestamp()
    }
    if (plan.note) {
      const existingNotes = data.notes
      update.notes = Array.isArray(existingNotes) ? FieldValue.arrayUnion(plan.note) : [plan.note]
    }
    tx.update(ref, update)
  })

  const fresh = await ref.get()
  if (!fresh.exists) throw new LeadNotFoundError()
  return serializeWebsiteLead(fresh.id, (fresh.data() || {}) as Record<string, unknown>)
}

export function redactErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Unknown error'
  return message.replace(/-----BEGIN[\s\S]*?-----END[^-]*-----/g, '[redacted]').slice(0, 300)
}

export function describeLeadsAdminError(error: unknown): { status: number; body: { error: string; code: string } } {
  if (error instanceof FirebaseAdminConfigError) {
    return { status: 503, body: { error: error.message, code: 'admin_credentials_missing' } }
  }
  if (error instanceof LeadNotFoundError) {
    return { status: 404, body: { error: error.message, code: 'not_found' } }
  }
  if (error instanceof LeadUpdateError) {
    return { status: 400, body: { error: error.message, code: 'invalid_update' } }
  }

  const detail = redactErrorMessage(error)
  console.error('websiteLeads admin error:', detail)
  if (/credential|permission-denied|unauthenticated|invalid_grant|ENOENT|project id|private key/i.test(detail)) {
    return {
      status: 503,
      body: {
        error: `Firebase Admin could not access Firestore (${detail}). Check the service account for this project. No Firestore rules change is required.`,
        code: 'admin_credentials_invalid',
      },
    }
  }
  return {
    status: 500,
    body: { error: 'Could not access website leads in Firestore.', code: 'leads_unavailable' },
  }
}
