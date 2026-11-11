'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  leadMatchesQuery,
  mailtoHref,
  telHref,
  type AdminLead,
  type AdminLeadType,
  type LeadStatus,
} from '@/lib/lead-records'

type LeadPatch = { status?: LeadStatus; note?: string }

type LeadsBoardProps = {
  leads: AdminLead[]
  onUpdateLead: (id: string, patch: LeadPatch) => Promise<void>
}

const cardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
} as const

const TYPE_LABELS: Record<AdminLeadType, string> = {
  trial: 'Trial',
  demo: 'Demo',
  other: 'Other',
}

const TYPE_STYLES: Record<AdminLeadType, { background: string; color: string }> = {
  trial: { background: '#FEF3C7', color: '#92400E' },
  demo: { background: '#DBEAFE', color: '#1E40AF' },
  other: { background: '#F3F4F6', color: '#374151' },
}

const STATUS_STYLES: Record<LeadStatus, { background: string; color: string }> = {
  new: { background: '#FEF3C7', color: '#92400E' },
  contacted: { background: '#DBEAFE', color: '#1D4ED8' },
  nurturing: { background: '#EDE9FE', color: '#6D28D9' },
  converted: { background: '#D1FAE5', color: '#065F46' },
  closed: { background: '#F3F4F6', color: '#374151' },
}

const NZ_TIME: Intl.DateTimeFormatOptions = {
  timeZone: 'Pacific/Auckland',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
}

function formatWhen(iso: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-NZ', NZ_TIME).format(date)
}

function display(value: string): string {
  return value.trim() ? value : '—'
}

function filterButtonStyle(active: boolean) {
  return {
    padding: '8px 16px',
    backgroundColor: active ? '#EAB308' : '#E5E7EB',
    color: active ? '#111827' : '#6B7280',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  } as const
}

function Pill({ label, background, color }: { label: string; background: string; color: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        backgroundColor: background,
        color,
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '15px', color: '#111827', lineHeight: 1.5 }}>{children}</div>
    </div>
  )
}

export default function LeadsBoard({ leads, onUpdateLead }: LeadsBoardProps) {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'trial' | 'demo'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | LeadStatus>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [saving, setSaving] = useState<'status' | 'note' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(null), 1500)
    return () => window.clearTimeout(timer)
  }, [copied])

  useEffect(() => {
    if (!selectedId) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId])

  useEffect(() => {
    if (!selectedId) return
    if (window.innerWidth >= 960) return
    document.getElementById('lead-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [selectedId])

  const searched = useMemo(() => leads.filter((lead) => leadMatchesQuery(lead, query)), [leads, query])

  const typeCounts = useMemo(() => {
    const pool = searched.filter((lead) => statusFilter === 'all' || lead.status === statusFilter)
    return {
      all: pool.length,
      trial: pool.filter((lead) => lead.type === 'trial').length,
      demo: pool.filter((lead) => lead.type === 'demo').length,
    }
  }, [searched, statusFilter])

  const statusCounts = useMemo(() => {
    const pool = searched.filter((lead) => typeFilter === 'all' || lead.type === typeFilter)
    const counts: Record<LeadStatus, number> = { new: 0, contacted: 0, nurturing: 0, converted: 0, closed: 0 }
    for (const lead of pool) counts[lead.status] += 1
    return { all: pool.length, ...counts }
  }, [searched, typeFilter])

  const visible = useMemo(
    () =>
      searched.filter((lead) => {
        if (typeFilter !== 'all' && lead.type !== typeFilter) return false
        if (statusFilter !== 'all' && lead.status !== statusFilter) return false
        return true
      }),
    [searched, typeFilter, statusFilter]
  )

  const selected = leads.find((lead) => lead.id === selectedId) || null
  const selectedHidden = Boolean(selected && !visible.some((lead) => lead.id === selected.id))
  const filtersActive = query.trim() !== '' || typeFilter !== 'all' || statusFilter !== 'all'

  async function copyValue(key: string, value: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value)
      } else {
        const input = document.createElement('textarea')
        input.value = value
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
      }
      setCopied(key)
    } catch {
      setActionError('Could not copy that value.')
    }
  }

  async function changeStatus(status: LeadStatus) {
    if (!selected || status === selected.status || saving) return
    setSaving('status')
    setActionError(null)
    try {
      await onUpdateLead(selected.id, { status })
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not update the status.')
    } finally {
      setSaving(null)
    }
  }

  async function addNote() {
    if (!selected || saving) return
    const note = noteDraft.trim()
    if (!note) {
      setActionError('Write a note before saving.')
      return
    }
    setSaving('note')
    setActionError(null)
    try {
      await onUpdateLead(selected.id, { note })
      setNoteDraft('')
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not save the note.')
    } finally {
      setSaving(null)
    }
  }

  if (leads.length === 0) {
    return (
      <div style={{ ...cardStyle, padding: '48px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>No leads yet</h2>
        <p style={{ fontSize: '15px', color: '#6B7280', maxWidth: '520px', margin: '0 auto', lineHeight: 1.6 }}>
          Trial and demo requests will appear here after someone submits a form on the website. Those forms still
          email office@builderbase.co.nz. Nothing on this page sends email.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div>
        <div style={{ marginBottom: '16px' }}>
          <input
            aria-label="Search leads by name, email, company, or phone"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email, company, or phone"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              fontSize: '15px',
              backgroundColor: '#FFFFFF',
              color: '#111827',
            }}
          />
        </div>

        <div style={{ marginBottom: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(
            [
              { value: 'all', label: `All types (${typeCounts.all})` },
              { value: 'trial', label: `Trial (${typeCounts.trial})` },
              { value: 'demo', label: `Demo (${typeCounts.demo})` },
            ] as const
          ).map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={typeFilter === item.value}
              onClick={() => setTypeFilter(item.value)}
              style={filterButtonStyle(typeFilter === item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            aria-pressed={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
            style={filterButtonStyle(statusFilter === 'all')}
          >
            All statuses ({statusCounts.all})
          </button>
          {LEAD_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              aria-pressed={statusFilter === status}
              onClick={() => setStatusFilter(status)}
              style={filterButtonStyle(statusFilter === status)}
            >
              {LEAD_STATUS_LABELS[status]} ({statusCounts[status]})
            </button>
          ))}
        </div>

        <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '12px' }}>
          Showing {visible.length} of {leads.length} {leads.length === 1 ? 'lead' : 'leads'}
          {filtersActive ? (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setTypeFilter('all')
                setStatusFilter('all')
              }}
              style={{
                marginLeft: '12px',
                border: 'none',
                background: 'none',
                color: '#A16207',
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Clear filters
            </button>
          ) : null}
        </p>

        <div style={{ ...cardStyle, overflowX: 'auto' }}>
          {visible.length === 0 ? (
            <p style={{ padding: '32px 24px', color: '#6B7280', textAlign: 'center' }}>
              No leads match this search or filter.
            </p>
          ) : (
            <table style={{ width: '100%', minWidth: '860px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', textAlign: 'left' }}>
                  {['Type', 'Date', 'Name', 'Company', 'Email', 'Phone', 'Plan', 'Team', 'Status'].map((heading) => (
                    <th
                      key={heading}
                      style={{ padding: '14px 12px', fontSize: '13px', fontWeight: 700, color: '#374151' }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((lead) => {
                  const isSelected = lead.id === selectedId
                  const emailHref = mailtoHref(lead.email)
                  const phoneHref = telHref(lead.phone)
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedId(lead.id)}
                      style={{
                        borderBottom: '1px solid #E5E7EB',
                        backgroundColor: isSelected ? '#FFFBEB' : '#FFFFFF',
                        boxShadow: isSelected ? 'inset 3px 0 0 #EAB308' : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <td style={{ padding: '14px 12px' }}>
                        <Pill label={TYPE_LABELS[lead.type]} {...TYPE_STYLES[lead.type]} />
                      </td>
                      <td style={{ padding: '14px 12px', color: '#6B7280', fontSize: '13px', whiteSpace: 'nowrap' }}>
                        {formatWhen(lead.createdAt)}
                      </td>
                      <td style={{ padding: '14px 12px', color: '#111827', fontWeight: 700 }}>
                        {lead.name || 'Unnamed'}
                      </td>
                      <td style={{ padding: '14px 12px', color: '#374151' }}>{display(lead.company)}</td>
                      <td style={{ padding: '14px 12px' }}>
                        {emailHref ? (
                          <a
                            href={emailHref}
                            onClick={(event) => event.stopPropagation()}
                            style={{ color: '#1D4ED8', fontWeight: 600, wordBreak: 'break-all' }}
                          >
                            {lead.email}
                          </a>
                        ) : (
                          display(lead.email)
                        )}
                      </td>
                      <td style={{ padding: '14px 12px', whiteSpace: 'nowrap' }}>
                        {phoneHref ? (
                          <a
                            href={phoneHref}
                            onClick={(event) => event.stopPropagation()}
                            style={{ color: '#1D4ED8', fontWeight: 600 }}
                          >
                            {lead.phone}
                          </a>
                        ) : (
                          display(lead.phone)
                        )}
                      </td>
                      <td style={{ padding: '14px 12px', color: '#374151' }}>{display(lead.plan)}</td>
                      <td style={{ padding: '14px 12px', color: '#374151' }}>{display(lead.teamSize)}</td>
                      <td style={{ padding: '14px 12px' }}>
                        <Pill label={LEAD_STATUS_LABELS[lead.status]} {...STATUS_STYLES[lead.status]} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div id="lead-detail" style={{ marginTop: '20px' }}>
        {!selected ? (
          <div style={{ ...cardStyle, padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Lead detail</h2>
            <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.6 }}>
              Select a lead to read the message, source, campaign fields, and internal notes. Status and notes are
              saved on the lead. They are not emailed.
            </p>
          </div>
        ) : (
          <div style={{ ...cardStyle, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <Pill label={TYPE_LABELS[selected.type]} {...TYPE_STYLES[selected.type]} />
                  <Pill label={LEAD_STATUS_LABELS[selected.status]} {...STATUS_STYLES[selected.status]} />
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#111827' }}>{selected.name || 'Unnamed'}</h2>
                <p style={{ color: '#6B7280', marginTop: '4px' }}>{display(selected.company)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label="Close lead detail"
                style={{
                  border: '1px solid #D1D5DB',
                  background: '#FFFFFF',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  color: '#374151',
                  height: 'fit-content',
                }}
              >
                Close
              </button>
            </div>

            {selectedHidden ? (
              <p style={{ fontSize: '13px', color: '#92400E', background: '#FFFBEB', padding: '8px 10px', borderRadius: '6px', marginBottom: '14px' }}>
                This lead is hidden by the current filters.
              </p>
            ) : null}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', alignItems: 'start' }}>
            <div>
            <label style={{ display: 'block', marginBottom: '14px' }}>
              <span style={{ display: 'block', fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>Status</span>
              <select
                aria-label="Lead status"
                value={selected.status}
                disabled={saving !== null}
                onChange={(event) => {
                  const next = event.target.value as LeadStatus
                  if (LEAD_STATUSES.includes(next)) void changeStatus(next)
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontSize: '15px',
                  fontWeight: 600,
                  backgroundColor: '#FFFFFF',
                  color: '#111827',
                }}
              >
                {LEAD_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {LEAD_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
              <span style={{ display: 'block', marginTop: '6px', fontSize: '12px', color: '#6B7280' }}>
                {saving === 'status'
                  ? 'Saving status…'
                  : selected.statusChangedAt
                    ? `Status changed ${formatWhen(selected.statusChangedAt)}`
                    : 'Status not changed yet'}
              </span>
            </label>

            <ContactLine
              label="Email"
              value={selected.email}
              href={mailtoHref(selected.email)}
              copyKey={`${selected.id}:email`}
              copied={copied}
              onCopy={copyValue}
            />
            <ContactLine
              label="Phone"
              value={selected.phone}
              href={telHref(selected.phone)}
              copyKey={`${selected.id}:phone`}
              copied={copied}
              onCopy={copyValue}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '160px 160px', gap: '12px' }}>
              <Field label="Plan">{display(selected.plan)}</Field>
              <Field label="Team size">{display(selected.teamSize)}</Field>
            </div>
            <Field label="Received">{formatWhen(selected.createdAt)}</Field>
            {selected.updatedAt ? <Field label="Last updated">{formatWhen(selected.updatedAt)}</Field> : null}
            <Field label="Message">
              <span style={{ whiteSpace: 'pre-wrap' }}>{selected.message.trim() ? selected.message : 'No message.'}</span>
            </Field>
            <Field label="Source">{display(selected.source)}</Field>
            <Field label="Campaign">
              {selected.utm ? (
                <div style={{ display: 'grid', gap: '4px' }}>
                  {(
                    [
                      ['utm_source', 'Source'],
                      ['utm_medium', 'Medium'],
                      ['utm_campaign', 'Campaign'],
                      ['utm_term', 'Term'],
                      ['utm_content', 'Content'],
                    ] as const
                  ).map(([key, label]) =>
                    selected.utm?.[key] ? (
                      <div key={key}>
                        <span style={{ color: '#6B7280' }}>{label}: </span>
                        {selected.utm[key]}
                      </div>
                    ) : null
                  )}
                </div>
              ) : (
                'No campaign parameters were captured.'
              )}
            </Field>
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', marginBottom: '10px' }}>Internal notes</h3>
              {selected.notes.length === 0 ? (
                <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '12px' }}>
                  No notes yet. Add context for the next follow-up.
                </p>
              ) : (
                <div style={{ display: 'grid', gap: '10px', marginBottom: '12px', maxHeight: '280px', overflowY: 'auto' }}>
                  {selected.notes.map((note) => (
                    <div key={note.id} style={{ background: '#F9FAFB', borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
                        {note.authorName || note.authorEmail || 'Admin'} · {formatWhen(note.createdAt)}
                      </div>
                      <div style={{ whiteSpace: 'pre-wrap', color: '#111827' }}>{note.text}</div>
                    </div>
                  ))}
                </div>
              )}
              <label htmlFor="lead-note" style={{ display: 'block', fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>
                Add a note
              </label>
              <textarea
                id="lead-note"
                value={noteDraft}
                maxLength={4000}
                rows={4}
                disabled={saving !== null}
                onChange={(event) => setNoteDraft(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                    event.preventDefault()
                    void addNote()
                  }
                }}
                placeholder="What was agreed, or what to do next"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                  {noteDraft.trim().length > 0 ? `${noteDraft.trim().length}/4000` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => void addNote()}
                  disabled={saving !== null || noteDraft.trim() === ''}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: noteDraft.trim() ? '#EAB308' : '#E5E7EB',
                    color: '#111827',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 700,
                    cursor: noteDraft.trim() && !saving ? 'pointer' : 'default',
                  }}
                >
                  {saving === 'note' ? 'Saving…' : 'Add note'}
                </button>
              </div>

            {actionError ? (
              <p role="alert" style={{ marginTop: '12px', color: '#991B1B', fontSize: '14px' }}>
                {actionError}
              </p>
            ) : null}

            <div
              style={{
                marginTop: '18px',
                border: '1px dashed #D1D5DB',
                borderRadius: '8px',
                padding: '14px',
                backgroundColor: '#FAFAFA',
              }}
            >
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#111827', marginBottom: '6px' }}>Nurture</h3>
              <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.5, marginBottom: '10px' }}>
                No sequence is sent from this page. A later nurture job can attach a sequence and a last-emailed time
                on this lead. Those values will show here.
              </p>
              <div style={{ fontSize: '14px', color: '#111827' }}>Sequence: {selected.nurture.sequenceId || 'Not attached'}</div>
              <div style={{ fontSize: '14px', color: '#111827', marginTop: '4px' }}>
                Last emailed: {selected.nurture.lastEmailedAt ? formatWhen(selected.nurture.lastEmailedAt) : 'Not recorded'}
              </div>
              </div>
            </div>
            </div>

            <p style={{ marginTop: '14px', fontSize: '12px', color: '#9CA3AF' }}>Record {selected.id}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ContactLine({
  label,
  value,
  href,
  copyKey,
  copied,
  onCopy,
}: {
  label: string
  value: string
  href: string | null
  copyKey: string
  copied: string | null
  onCopy: (key: string, value: string) => void
}) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>{label}</div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        {value && href ? (
          <a href={href} style={{ color: '#1D4ED8', fontWeight: 700, wordBreak: 'break-all' }}>
            {value}
          </a>
        ) : (
          <span style={{ fontWeight: 700, color: '#111827' }}>{display(value)}</span>
        )}
        {value ? (
          <button
            type="button"
            onClick={() => onCopy(copyKey, value)}
            style={{
              border: '1px solid #D1D5DB',
              background: '#FFFFFF',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              color: '#374151',
            }}
          >
            {copied === copyKey ? 'Copied' : 'Copy'}
          </button>
        ) : null}
      </div>
    </div>
  )
}
