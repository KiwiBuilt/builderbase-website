import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const

export type LeadType = 'trial' | 'demo'

export type WebsiteLead = {
  type: LeadType
  name: string
  email: string
  phone: string
  company: string
  message: string
  plan: string
  source: string
  utm: Record<string, string> | null
  teamSize: string
}

export function stringField(value: unknown, max = 4000): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

export function utmField(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const utm: Record<string, string> = {}
  for (const key of UTM_KEYS) {
    const item = stringField(record[key], 200)
    if (item) utm[key] = item
  }
  return Object.keys(utm).length ? utm : null
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function saveWebsiteLead(lead: WebsiteLead): Promise<void> {
  await addDoc(collection(db, 'websiteLeads'), {
    type: lead.type,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    company: lead.company,
    message: lead.message,
    plan: lead.plan,
    source: lead.source,
    utm: lead.utm,
    teamSize: lead.teamSize,
    createdAt: serverTimestamp(),
  })
}

const LEAD_ATTEMPT_TIMEOUT_MS = 12000

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out`)), LEAD_ATTEMPT_TIMEOUT_MS)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })
}

export async function deliverLead(options: {
  lead: WebsiteLead
  sendEmail: () => Promise<void>
}): Promise<{ ok: true; saved: boolean; emailed: boolean } | { ok: false }> {
  const [saveResult, emailResult] = await Promise.allSettled([
    withTimeout(saveWebsiteLead(options.lead), 'Firestore save'),
    withTimeout(options.sendEmail(), 'Notification email'),
  ])

  const saved = saveResult.status === 'fulfilled'
  const emailed = emailResult.status === 'fulfilled'

  if (!saved) {
    console.error('websiteLeads save failed:', saveResult.reason)
  }
  if (!emailed) {
    console.error('Lead email failed:', emailResult.reason)
  }
  if (!saved && !emailed) {
    return { ok: false }
  }

  return { ok: true, saved, emailed }
}
