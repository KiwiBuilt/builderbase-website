import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  compareLeadsNewestFirst,
  firestoreTimeToIso,
  isLeadDocumentId,
  leadMatchesQuery,
  mailtoHref,
  mergeLeadSnapshots,
  normalizeLeadStatus,
  planLeadPatch,
  serializeWebsiteLead,
  summarizeLeads,
  telHref,
  type AdminLead,
} from './lead-records.ts'

const meta = {
  nowIso: '2026-11-11T02:00:00.000Z',
  noteId: 'note-1',
  authorName: 'Corey',
  authorEmail: 'office@builderbase.co.nz',
}

function lead(overrides: Partial<AdminLead> = {}): AdminLead {
  return {
    id: 'abc',
    type: 'trial',
    name: 'Aroha Ngata',
    email: 'aroha@example.co.nz',
    phone: '021 555 0188',
    company: 'Ngata Build',
    message: 'Need variations',
    plan: 'Essential',
    source: 'https://builderbase.co.nz/#pricing',
    teamSize: '4',
    utm: null,
    status: 'new',
    statusChangedAt: null,
    createdAt: '2026-11-10T01:00:00.000Z',
    updatedAt: null,
    notes: [],
    nurture: { sequenceId: null, lastEmailedAt: null },
    ...overrides,
  }
}

describe('lead records', () => {
  it('treats a missing or unknown status as New', () => {
    assert.equal(normalizeLeadStatus(undefined), 'new')
    assert.equal(normalizeLeadStatus(''), 'new')
    assert.equal(normalizeLeadStatus('won'), 'new')
    assert.equal(normalizeLeadStatus(' Contacted '), 'contacted')
    const stored = serializeWebsiteLead('abc123', { type: 'demo', email: 'a@b.co' })
    assert.equal(stored.status, 'new')
    assert.equal(stored.nurture.sequenceId, null)
    assert.equal(stored.nurture.lastEmailedAt, null)
    assert.equal(stored.notes.length, 0)
  })

  it('keeps enquiry fields, campaign values, and a nurture slot', () => {
    const stored = serializeWebsiteLead('abc123', {
      type: 'trial',
      name: 'Aroha Ngata',
      email: 'aroha@example.co.nz',
      phone: '021 555 0188',
      company: 'Ngata Build',
      message: 'Need variations',
      plan: 'Essential',
      source: 'https://builderbase.co.nz/#pricing',
      teamSize: '4',
      utm: { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'trial', utm_term: '  ', utm_content: 'ad' },
      createdAt: { toDate: () => new Date('2026-11-10T01:00:00.000Z') },
      nurture: { sequenceId: 'welcome', lastEmailedAt: '2026-11-11T00:00:00.000Z' },
      notes: [{ id: 'n1', text: 'Called once', createdAt: '2026-11-11T01:00:00.000Z', authorName: 'Corey' }],
    })
    assert.equal(stored.type, 'trial')
    assert.equal(stored.utm?.utm_source, 'google')
    assert.equal(stored.utm?.utm_term, undefined)
    assert.equal(stored.createdAt, '2026-11-10T01:00:00.000Z')
    assert.equal(stored.nurture.sequenceId, 'welcome')
    assert.equal(stored.nurture.lastEmailedAt, '2026-11-11T00:00:00.000Z')
    assert.equal(stored.notes[0]?.text, 'Called once')
    assert.equal(serializeWebsiteLead('abc123', { utm: { utm_source: '   ' } }).utm, null)
  })

  it('reads Firestore timestamps and sorts newest first', () => {
    assert.equal(firestoreTimeToIso({ _seconds: 1762732800 }), '2025-11-10T00:00:00.000Z')
    assert.equal(firestoreTimeToIso('not-a-date'), null)
    const older = lead({ id: 'old', createdAt: '2026-11-01T00:00:00.000Z' })
    const newer = lead({ id: 'new', createdAt: '2026-11-10T00:00:00.000Z' })
    const undated = lead({ id: 'none', createdAt: null })
    assert.deepEqual([older, undated, newer].sort(compareLeadsNewestFirst).map((item) => item.id), ['new', 'old', 'none'])
  })

  it('plans status and timestamped notes without touching enquiry fields', () => {
    const same = planLeadPatch({}, { status: 'new', email: 'evil@example.com' }, meta)
    assert.deepEqual(same, { ok: true, unchanged: true })

    const next = planLeadPatch({ status: 'new' }, { status: 'Nurturing', note: '  Left a voicemail  ' }, meta)
    if (next.ok !== true || next.unchanged !== false) throw new Error('expected a change')
    assert.equal(next.status, 'nurturing')
    assert.equal(next.note?.text, 'Left a voicemail')
    assert.equal(next.note?.createdAt, meta.nowIso)
    assert.equal(next.note?.authorEmail, meta.authorEmail)
    assert.deepEqual(Object.keys(next).sort(), ['note', 'ok', 'status', 'unchanged'])

    assert.equal(planLeadPatch({}, { status: 'archived' }, meta).ok, false)
    assert.equal(planLeadPatch({}, { note: '   ' }, meta).ok, false)
    assert.equal(planLeadPatch({ notes: new Array(100).fill({ text: 'x' }) }, { note: 'another' }, meta).ok, false)
  })

  it('merges an older status response with a newer note', () => {
    const withStatus = lead({
      status: 'contacted',
      statusChangedAt: '2026-11-11T03:00:00.000Z',
      updatedAt: '2026-11-11T03:00:00.000Z',
      notes: [],
    })
    const withNote = lead({
      status: 'new',
      statusChangedAt: null,
      updatedAt: '2026-11-11T04:00:00.000Z',
      notes: [
        {
          id: 'n1',
          text: 'Booked for Thursday',
          createdAt: '2026-11-11T04:00:00.000Z',
          authorName: 'Corey',
          authorEmail: null,
        },
      ],
    })
    const merged = mergeLeadSnapshots(withStatus, withNote)
    assert.equal(merged.status, 'contacted')
    assert.equal(merged.notes.length, 1)
    assert.equal(merged.updatedAt, withNote.updatedAt)
  })

  it('searches name, email, company, and phone, and builds safe links', () => {
    const sample = lead()
    assert.equal(leadMatchesQuery(sample, 'ngata'), true)
    assert.equal(leadMatchesQuery(sample, 'AROHA@'), true)
    assert.equal(leadMatchesQuery(sample, '555'), true)
    assert.equal(leadMatchesQuery(sample, '0215550188'), true)
    assert.equal(leadMatchesQuery(sample, 'unrelated'), false)
    assert.equal(mailtoHref(sample.email), 'mailto:aroha@example.co.nz')
    assert.equal(mailtoHref('not an email'), null)
    assert.equal(telHref('021 555 0188'), 'tel:0215550188')
    assert.equal(telHref('abc'), null)
    assert.equal(isLeadDocumentId('Abc123'), true)
    assert.equal(isLeadDocumentId('../secret'), false)
  })

  it('summarizes counts and counts missing status as new', () => {
    const summary = summarizeLeads([
      lead({ status: 'new', type: 'trial' }),
      lead({ id: 'b', status: 'converted', type: 'demo' }),
      serializeWebsiteLead('c', { type: 'trial' }),
    ])
    assert.equal(summary.total, 3)
    assert.equal(summary.byStatus.new, 2)
    assert.equal(summary.byStatus.converted, 1)
    assert.equal(summary.byType.trial, 2)
    assert.equal(summary.byType.demo, 1)
  })
})
