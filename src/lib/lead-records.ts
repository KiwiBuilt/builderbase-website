/**
 * Admin view of a websiteLeads document.
 *
 * Public trial and demo forms write the enquiry fields only. Status, notes,
 * and timestamps below are added later by a signed-in admin. Missing status
 * is treated as New so older records still show up in the queue.
 *
 * Reserved for a future nurture sender. This admin never writes `nurture`
 * and never sends email. A later job can store:
 *   nurture.sequenceId: string | null
 *   nurture.lastEmailedAt: timestamp | string | null
 */

export const LEAD_STATUSES = ['new', 'contacted', 'nurturing', 'converted', 'closed'] as const

export type LeadStatus = (typeof LEAD_STATUSES)[number]

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  nurturing: 'Nurturing',
  converted: 'Converted',
  closed: 'Closed',
}

export const LEAD_NOTE_MAX = 4000
export const LEAD_NOTES_MAX = 100

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const

export type LeadUtm = Partial<Record<(typeof UTM_KEYS)[number], string>>

export type LeadNote = {
  id: string
  text: string
  createdAt: string | null
  authorName: string | null
  authorEmail: string | null
}

export type LeadNurtureSlot = {
  sequenceId: string | null
  lastEmailedAt: string | null
}

export type AdminLeadType = 'trial' | 'demo' | 'other'

export type AdminLead = {
  id: string
  type: AdminLeadType
  name: string
  email: string
  phone: string
  company: string
  message: string
  plan: string
  source: string
  teamSize: string
  utm: LeadUtm | null
  status: LeadStatus
  statusChangedAt: string | null
  createdAt: string | null
  updatedAt: string | null
  notes: LeadNote[]
  nurture: LeadNurtureSlot
}

export class LeadNotFoundError extends Error {
  readonly code = 'not_found'
  constructor() {
    super('That lead could not be found.')
    this.name = 'LeadNotFoundError'
  }
}

export class LeadUpdateError extends Error {
  readonly code = 'invalid_update'
  constructor(message: string) {
    super(message)
    this.name = 'LeadUpdateError'
  }
}

export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === 'string' && (LEAD_STATUSES as readonly string[]).includes(value.trim().toLowerCase())
}

export function parseLeadStatus(value: unknown): LeadStatus | null {
  if (typeof value !== 'string') return null
  const key = value.trim().toLowerCase()
  if ((LEAD_STATUSES as readonly string[]).includes(key)) return key as LeadStatus
  return null
}

export function normalizeLeadStatus(value: unknown): LeadStatus {
  return parseLeadStatus(value) ?? 'new'
}

export function isLeadDocumentId(id: string): boolean {
  return /^[A-Za-z0-9]{1,128}$/.test(id)
}

export function mailtoHref(email: string): string | null {
  const trimmed = email.trim()
  if (!/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(trimmed)) return null
  return `mailto:${trimmed}`
}

export function telHref(phone: string): string | null {
  const compact = phone.trim().replace(/[^\d+]/g, '')
  const digits = compact.replace(/\D/g, '')
  if (digits.length < 6 || digits.length > 20) return null
  if (!/^\+?\d+$/.test(compact)) return null
  return `tel:${compact}`
}

export function firestoreTimeToIso(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? null : new Date(parsed).toISOString()
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString()
  }
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const toDate = (value as { toDate?: unknown }).toDate
    if (typeof toDate === 'function') {
      const date = toDate.call(value)
      if (date instanceof Date && !Number.isNaN(date.getTime())) return date.toISOString()
    }
  }
  if (typeof value === 'object' && value !== null && '_seconds' in value) {
    const seconds = (value as { _seconds?: unknown })._seconds
    if (typeof seconds === 'number' && Number.isFinite(seconds)) {
      return new Date(seconds * 1000).toISOString()
    }
  }
  return null
}

function asString(value: unknown, max = 8000): string {
  if (typeof value === 'string') return value.trim().slice(0, max)
  if (typeof value === 'number' && Number.isFinite(value)) return String(value).slice(0, max)
  return ''
}

function asAuthor(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim().slice(0, 200)
  return trimmed || null
}

function asLeadType(value: unknown): AdminLeadType {
  if (value === 'trial' || value === 'demo') return value
  return 'other'
}

function readUtm(value: unknown): LeadUtm | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const utm: LeadUtm = {}
  for (const key of UTM_KEYS) {
    const item = asString(record[key], 200)
    if (item) utm[key] = item
  }
  return Object.keys(utm).length ? utm : null
}

function readNurture(value: unknown): LeadNurtureSlot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { sequenceId: null, lastEmailedAt: null }
  }
  const record = value as Record<string, unknown>
  const sequenceId = asString(record.sequenceId, 200)
  return {
    sequenceId: sequenceId || null,
    lastEmailedAt: firestoreTimeToIso(record.lastEmailedAt),
  }
}

function readNote(value: unknown, index: number): LeadNote | null {
  if (typeof value === 'string') {
    const text = value.trim().slice(0, LEAD_NOTE_MAX)
    if (!text) return null
    return { id: `legacy-${index}`, text, createdAt: null, authorName: null, authorEmail: null }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const text = asString(record.text, LEAD_NOTE_MAX)
  if (!text) return null
  const id = asString(record.id, 80) || `note-${index}`
  return {
    id,
    text,
    createdAt: firestoreTimeToIso(record.createdAt),
    authorName: asString(record.authorName, 200) || null,
    authorEmail: asString(record.authorEmail, 320) || null,
  }
}

function noteTime(note: LeadNote): number {
  if (!note.createdAt) return Number.POSITIVE_INFINITY
  const time = Date.parse(note.createdAt)
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time
}

export function sortLeadNotes(notes: LeadNote[]): LeadNote[] {
  return notes
    .map((note, index) => ({ note, index }))
    .sort((a, b) => {
      const delta = noteTime(a.note) - noteTime(b.note)
      return delta || a.index - b.index
    })
    .map((item) => item.note)
}

export function serializeWebsiteLead(id: string, data: Record<string, unknown> | undefined): AdminLead {
  const record = data || {}
  const notes = Array.isArray(record.notes)
    ? sortLeadNotes(record.notes.map(readNote).filter((note): note is LeadNote => note !== null))
    : []

  return {
    id,
    type: asLeadType(record.type),
    name: asString(record.name, 200),
    email: asString(record.email, 320),
    phone: asString(record.phone, 50),
    company: asString(record.company, 200),
    message: asString(record.message, 8000),
    plan: asString(record.plan, 100),
    source: asString(record.source, 500),
    teamSize: asString(record.teamSize, 50),
    utm: readUtm(record.utm),
    status: normalizeLeadStatus(record.status),
    statusChangedAt: firestoreTimeToIso(record.statusChangedAt),
    createdAt: firestoreTimeToIso(record.createdAt),
    updatedAt: firestoreTimeToIso(record.updatedAt),
    notes,
    nurture: readNurture(record.nurture),
  }
}

export function compareLeadsNewestFirst(a: AdminLead, b: AdminLead): number {
  const aTime = a.createdAt ? Date.parse(a.createdAt) : 0
  const bTime = b.createdAt ? Date.parse(b.createdAt) : 0
  const aSort = Number.isNaN(aTime) ? 0 : aTime
  const bSort = Number.isNaN(bTime) ? 0 : bTime
  if (aSort !== bSort) return bSort - aSort
  return b.id.localeCompare(a.id)
}

export type LeadPatchPlan =
  | { ok: false; error: string }
  | { ok: true; unchanged: true }
  | { ok: true; unchanged: false; status?: LeadStatus; note?: LeadNote }

export function planLeadPatch(
  existing: Record<string, unknown> | undefined,
  body: unknown,
  meta: { nowIso: string; noteId: string; authorName: string | null; authorEmail: string | null }
): LeadPatchPlan {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Invalid request.' }
  }

  const record = body as Record<string, unknown>
  const hasStatus = Object.prototype.hasOwnProperty.call(record, 'status')
  const hasNote = Object.prototype.hasOwnProperty.call(record, 'note')
  if (!hasStatus && !hasNote) {
    return { ok: false, error: 'Send a status or a note to update.' }
  }

  const current = existing || {}
  let nextStatus: LeadStatus | undefined
  if (hasStatus) {
    const parsed = parseLeadStatus(record.status)
    if (!parsed) {
      return { ok: false, error: 'Status must be New, Contacted, Nurturing, Converted, or Closed.' }
    }
    if (parsed !== normalizeLeadStatus(current.status)) nextStatus = parsed
  }

  let note: LeadNote | undefined
  if (hasNote) {
    if (typeof record.note !== 'string') return { ok: false, error: 'Note must be text.' }
    const text = record.note.trim()
    if (!text) return { ok: false, error: 'Write a note before saving.' }
    if (text.length > LEAD_NOTE_MAX) {
      return { ok: false, error: `Notes are limited to ${LEAD_NOTE_MAX} characters.` }
    }
    const existingNotes = Array.isArray(current.notes) ? current.notes : []
    if (existingNotes.length >= LEAD_NOTES_MAX) {
      return { ok: false, error: `This lead already has ${LEAD_NOTES_MAX} notes.` }
    }
    note = {
      id: meta.noteId,
      text,
      createdAt: meta.nowIso,
      authorName: asAuthor(meta.authorName),
      authorEmail: asAuthor(meta.authorEmail),
    }
  }

  if (!nextStatus && !note) return { ok: true, unchanged: true }
  return { ok: true, unchanged: false, status: nextStatus, note }
}

export function summarizeLeads(leads: AdminLead[]): {
  total: number
  byStatus: Record<LeadStatus, number>
  byType: Record<AdminLeadType, number>
} {
  const byStatus: Record<LeadStatus, number> = {
    new: 0,
    contacted: 0,
    nurturing: 0,
    converted: 0,
    closed: 0,
  }
  const byType: Record<AdminLeadType, number> = { trial: 0, demo: 0, other: 0 }
  for (const lead of leads) {
    byStatus[lead.status] += 1
    byType[lead.type] += 1
  }
  return { total: leads.length, byStatus, byType }
}

function unionNotes(left: LeadNote[], right: LeadNote[]): LeadNote[] {
  const map = new Map<string, LeadNote>()
  for (const note of left) map.set(note.id, note)
  for (const note of right) map.set(note.id, note)
  return sortLeadNotes([...map.values()])
}

export function mergeLeadSnapshots(local: AdminLead, incoming: AdminLead): AdminLead {
  if (local.id !== incoming.id) return incoming
  const localStatus = local.statusChangedAt ? Date.parse(local.statusChangedAt) : 0
  const incomingStatus = incoming.statusChangedAt ? Date.parse(incoming.statusChangedAt) : 0
  const useIncomingStatus = (Number.isNaN(incomingStatus) ? 0 : incomingStatus) >= (Number.isNaN(localStatus) ? 0 : localStatus)
  const localUpdated = local.updatedAt ? Date.parse(local.updatedAt) : 0
  const incomingUpdated = incoming.updatedAt ? Date.parse(incoming.updatedAt) : 0
  const base = (Number.isNaN(incomingUpdated) ? 0 : incomingUpdated) >= (Number.isNaN(localUpdated) ? 0 : localUpdated) ? incoming : local
  return {
    ...base,
    notes: unionNotes(local.notes, incoming.notes),
    status: useIncomingStatus ? incoming.status : local.status,
    statusChangedAt: useIncomingStatus ? incoming.statusChangedAt : local.statusChangedAt,
  }
}

export function leadMatchesQuery(lead: AdminLead, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  const haystack = [lead.name, lead.email, lead.company, lead.phone].join('\n').toLowerCase()
  if (haystack.includes(needle)) return true
  const digits = needle.replace(/\D/g, '')
  return digits.length >= 3 && lead.phone.replace(/\D/g, '').includes(digits)
}
