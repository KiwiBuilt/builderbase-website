'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { collection, doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [globalRules, setGlobalRules] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingRules, setEditingRules] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    } else if (status === 'authenticated') {
      setLoading(false)
      loadSettings()
    }
  }, [status, router])

  const loadSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'aiRules'))
      if (settingsDoc.exists()) {
        setGlobalRules(settingsDoc.data()?.rules || '')
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, 'settings', 'aiRules'), {
        rules: globalRules,
        updatedAt: new Date().toISOString(),
      })
      setSavedMessage('✅ Settings saved! All future posts will use these rules.')
      setTimeout(() => setSavedMessage(''), 3000)
      setEditingRules(false)
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (status === 'unauthenticated') return null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6', padding: '32px 16px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => router.back()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#E5E7EB',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              color: '#374151',
            }}
          >
            ← Back
          </button>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}
        >
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
            ⚙️ AI Settings
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
            Set global rules that the AI will follow for ALL blog posts. Leave blank to let AI generate freely.
          </p>

          {savedMessage && (
            <div style={{ padding: '12px', backgroundColor: '#DCFCE7', borderRadius: '6px', marginBottom: '16px', color: '#166534', fontSize: '14px', fontWeight: 600 }}>
              {savedMessage}
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151', display: 'block' }}>
                Global AI Rules & Instructions
              </label>
              {!editingRules && (
                <button
                  onClick={() => setEditingRules(true)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#F3F4F6',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  ✏️ Edit
                </button>
              )}
            </div>

            {editingRules ? (
              <>
                <textarea
                  value={globalRules}
                  onChange={(e) => setGlobalRules(e.target.value)}
                  placeholder={`Example:
- Always mention specific NZ building regulations
- Include at least 3 actionable tips per post
- Use real construction examples from Auckland/Wellington/Christchurch
- Keep paragraphs to 2-3 sentences max
- Include cost estimates when relevant
- Focus on practical advice for builders
- End with a "Key Takeaway" section
- Use professional but friendly tone`}
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '13px',
                    minHeight: '300px',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box',
                  }}
                />
                <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>
                  {globalRules.length} characters
                </p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#EAB308',
                      color: '#111827',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '14px',
                      opacity: saving ? 0.5 : 1,
                    }}
                  >
                    {saving ? 'Saving...' : '💾 Save Rules'}
                  </button>
                  <button
                    onClick={() => setEditingRules(false)}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#F3F4F6',
                      color: '#374151',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '14px',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div style={{ padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '6px', minHeight: '100px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '13px', lineHeight: '1.6', color: globalRules ? '#374151' : '#9CA3AF' }}>
                {globalRules || '(No global rules set. AI will generate freely.)'}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div style={{ padding: '16px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFe', borderRadius: '6px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#0369A1' }}>
              💡 How This Works
            </h3>
            <ul style={{ fontSize: '13px', color: '#375576', lineHeight: '1.6', paddingLeft: '20px', margin: 0 }}>
              <li>These rules are automatically sent to the AI every time you create a blog post</li>
              <li>The AI will ALWAYS follow these instructions (if set)</li>
              <li>You can edit these anytime and they apply to ALL future posts</li>
              <li>If blank, the AI will generate using its default construction industry knowledge</li>
              <li>You can still add topic-specific context when creating individual posts</li>
            </ul>
          </div>
        </div>

        {/* Ahrefs Analytics Section */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            marginTop: '24px',
          }}
        >
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
            📊 Ahrefs Analytics
          </h2>
          <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
            Installation guide for Ahrefs analytics tracking on your website.
          </p>

          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
              Installation Guide
            </h3>
            <p style={{ fontSize: '14px', color: '#4B5563', lineHeight: '1.6', marginBottom: '16px' }}>
              Copy the snippet below and paste it into the <code>&lt;head&gt;</code> section of your site. Once done, click the "Recheck installation" button to verify your installation.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>
                <strong>Data Key:</strong>
              </p>
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#F3F4F6',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: '#374151',
                  borderLeft: '3px solid #EAB308',
                  wordBreak: 'break-all',
                }}
              >
                ZZ+5iN0rEPiDTyiEyduY+g
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>
                <strong>Script to Install:</strong>
              </p>
              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#1F2937',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: '#E5E7EB',
                  overflow: 'auto',
                  borderLeft: '3px solid #EAB308',
                }}
              >
                <pre style={{ margin: 0 }}>
{`<script src="https://analytics.ahrefs.com/analytics.js" data-key="ZZ+5iN0rEPiDTyiEyduY+g" async></script>`}
                </pre>
              </div>
            </div>

            <button
              onClick={() => {
                const scriptText = `<script src="https://analytics.ahrefs.com/analytics.js" data-key="ZZ+5iN0rEPiDTyiEyduY+g" async></script>`
                navigator.clipboard.writeText(scriptText)
                alert('✅ Script copied to clipboard!')
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#EAB308',
                color: '#111827',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                marginBottom: '24px',
              }}
            >
              📋 Copy Script
            </button>

            <div style={{ marginBottom: '24px' }}>
              <a
                href="https://ahrefs.com/analytics"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '10px 16px',
                  backgroundColor: '#F3F4F6',
                  color: '#0369A1',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                🔗 Recheck Installation
              </a>
            </div>
          </div>

          {/* Alternative Installation Method */}
          <div style={{ paddingTop: '24px', borderTop: '1px solid #E5E7EB' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
              Install with Google Tag Manager
            </h3>
            <p style={{ fontSize: '14px', color: '#4B5563', lineHeight: '1.6', marginBottom: '16px' }}>
              If you're using Google Tag Manager, follow these steps:
            </p>
            <ol style={{ fontSize: '14px', color: '#4B5563', lineHeight: '1.8', paddingLeft: '20px' }}>
              <li>Log in to your Google Tag Manager account</li>
              <li>Click <strong>New Tag</strong> and select <strong>Custom HTML</strong></li>
              <li>Paste the script snippet above into the HTML field</li>
              <li>Set the trigger to fire on <strong>All Pages</strong></li>
              <li>Click <strong>Save</strong> and publish your container</li>
            </ol>
          </div>

          {/* Info Box */}
          <div style={{ padding: '16px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '6px', marginTop: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#15803D' }}>
              ℹ️ About Ahrefs Analytics
            </h3>
            <ul style={{ fontSize: '13px', color: '#166534', lineHeight: '1.6', paddingLeft: '20px', margin: 0 }}>
              <li>Tracks visitor behavior and engagement on your website</li>
              <li>Provides insights into traffic sources and user flow</li>
              <li>Complements your existing analytics setup</li>
              <li>Data key must be included for tracking to work correctly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
