'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LeadsBoard from '@/components/admin/LeadsBoard'
import { mergeLeadSnapshots, type AdminLead, type LeadStatus } from '@/lib/lead-records'

export const dynamic = 'force-dynamic'

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json()
    if (data && typeof data.error === 'string' && data.error.trim()) return data.error
  } catch {
    // The body was not JSON.
  }
  return fallback
}

export default function AdminLeadsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [leads, setLeads] = useState<AdminLead[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const loadLeads = useCallback(async () => {
    setRefreshing(true)
    let redirected = false
    try {
      const response = await fetch('/api/leads', { cache: 'no-store' })
      if (response.status === 401) {
        redirected = true
        router.push('/admin/login')
        return
      }
      if (!response.ok) {
        setError(await readError(response, 'Could not load leads.'))
        return
      }
      const data = await response.json()
      setLeads(Array.isArray(data?.leads) ? data.leads : [])
      setError(null)
      setLoaded(true)
    } catch {
      setError('Could not load leads. Check the connection and try again.')
    } finally {
      setRefreshing(false)
      if (!redirected) setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    } else if (status === 'authenticated') {
      void loadLeads()
    }
  }, [status, router, loadLeads])

  async function updateLead(id: string, patch: { status?: LeadStatus; note?: string }) {
    const response = await fetch('/api/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    })
    if (response.status === 401) {
      router.push('/admin/login')
      throw new Error('Sign in again to update leads.')
    }
    const data = await response.json().catch(() => null)
    if (!response.ok || !data?.lead) {
      throw new Error(data?.error || 'Could not update this lead.')
    }
    const incoming = data.lead as AdminLead
    setLeads((current) => current.map((lead) => (lead.id === incoming.id ? mergeLeadSnapshots(lead, incoming) : lead)))
  }

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#F9FAFB',
        }}
      >
        <p style={{ fontSize: '16px', color: '#6B7280' }}>Loading...</p>
      </div>
    )
  }

  if (status !== 'authenticated') return null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '32px 16px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <Link
            href="/admin/dashboard"
            style={{
              padding: '8px 16px',
              backgroundColor: '#E5E7EB',
              borderRadius: '6px',
              textDecoration: 'none',
              display: 'inline-block',
              fontSize: '14px',
              fontWeight: 600,
              color: '#374151',
            }}
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '24px',
          }}
        >
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>Leads</h1>
            <p style={{ fontSize: '16px', color: '#6B7280', maxWidth: '680px', lineHeight: 1.5 }}>
              Trial and demo requests saved from the website. Signed in as {session?.user?.email || session?.user?.name}.
              Changing a status or adding a note stays on the lead. This page does not email the lead or the office.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadLeads()}
            disabled={refreshing}
            style={{
              padding: '10px 16px',
              backgroundColor: '#FFFFFF',
              color: '#111827',
              fontSize: '14px',
              fontWeight: 600,
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              cursor: refreshing ? 'default' : 'pointer',
            }}
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {error ? (
          <div
            role="alert"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              borderLeft: '4px solid #EAB308',
              padding: '20px 24px',
              marginBottom: '20px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>
              Leads could not be loaded
            </h2>
            <p style={{ fontSize: '15px', color: '#374151', lineHeight: 1.6, marginBottom: '14px' }}>{error}</p>
            <button
              type="button"
              onClick={() => void loadLeads()}
              style={{
                padding: '8px 14px',
                backgroundColor: '#EAB308',
                color: '#111827',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        ) : null}

        {loaded ? <LeadsBoard leads={leads} onUpdateLead={updateLead} /> : null}
      </div>
    </div>
  )
}
