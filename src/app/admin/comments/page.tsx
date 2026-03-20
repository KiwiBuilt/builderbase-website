'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function CommentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [comments, setComments] = useState<any[]>([])
  const [blogs, setBlogs] = useState<any[]>([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    } else if (status === 'authenticated') {
      loadComments()
      loadBlogs()
    }
  }, [status, filter])

  const loadComments = async () => {
    try {
      const query = filter === 'all' ? '' : filter === 'pending' ? '?pending=true' : `?approved=${filter === 'approved'}`
      const res = await fetch(`/api/comments${query}`)
      if (res.ok) {
        const data = await res.json()
        setComments(data)
      }
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadBlogs = async () => {
    try {
      const res = await fetch('/api/blogs')
      if (res.ok) {
        const data = await res.json()
        setBlogs(data)
      }
    } catch (error) {
      console.error('Error loading blogs:', error)
    }
  }

  const getBlogTitle = (blogId: string) => {
    const blog = blogs.find((b) => b.id === blogId)
    return blog?.title || 'Unknown'
  }

  const handleApprove = async (commentId: string) => {
    try {
      const res = await fetch('/api/comments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: commentId, approved: true }),
      })
      if (res.ok) {
        loadComments()
      }
    } catch (error) {
      console.error('Error approving comment:', error)
    }
  }

  const handleReject = async (commentId: string) => {
    try {
      const res = await fetch('/api/comments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: commentId }),
      })
      if (res.ok) {
        loadComments()
      }
    } catch (error) {
      console.error('Error rejecting comment:', error)
    }
  }

  if (status === 'loading' || loading) {
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

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '32px 16px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <Link
            href="/admin/dashboard"
            style={{
              padding: '8px 16px',
              backgroundColor: '#E5E7EB',
              border: 'none',
              borderRadius: '6px',
              textDecoration: 'none',
              display: 'inline-block',
              fontSize: '14px',
              fontWeight: 600,
              color: '#374151',
              cursor: 'pointer',
            }}
          >
            ← Back to Dashboard
          </Link>
        </div>

        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', marginBottom: '24px' }}>
          Comments Moderation
        </h1>

        {/* Filters */}
        <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
          {[
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'all', label: 'All' },
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => {
                setFilter(btn.value)
                setLoading(true)
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: filter === btn.value ? '#EAB308' : '#E5E7EB',
                color: filter === btn.value ? '#111827' : '#6B7280',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Comments List */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }}
        >
          {comments.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: '16px', color: '#6B7280' }}>
                {filter === 'pending' ? 'No pending comments' : 'No comments found'}
              </p>
            </div>
          ) : (
            <div>
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  style={{
                    padding: '24px',
                    borderBottom: '1px solid #E5E7EB',
                  }}
                >
                  <div style={{ marginBottom: '12px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div>
                        <p style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                          {comment.name}
                        </p>
                        <p style={{ fontSize: '14px', color: '#6B7280' }}>{comment.email}</p>
                        <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '4px' }}>
                          On: <strong>{getBlogTitle(comment.blogId)}</strong>
                        </p>
                      </div>
                      <span
                        style={{
                          padding: '4px 12px',
                          backgroundColor: comment.approved ? '#DBEAFE' : '#FEE2E2',
                          color: comment.approved ? '#0369A1' : '#991B1B',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        {comment.approved ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '6px',
                      marginBottom: '12px',
                      borderLeft: '3px solid #EAB308',
                    }}
                  >
                    <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
                      {comment.content}
                    </p>
                  </div>

                  {!comment.approved && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => handleApprove(comment.id)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#10B981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleReject(comment.id)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#EF4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
