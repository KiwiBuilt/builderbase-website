'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [blogs, setBlogs] = useState<any[]>([])
  const [stats, setStats] = useState({ totalVisits: 0, totalBlogs: 0, pendingComments: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    } else if (status === 'authenticated') {
      loadBlogs()
      loadStats()
    }
  }, [status])

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

  const loadStats = async () => {
    try {
      const [blogsRes, commentsRes] = await Promise.all([
        fetch('/api/blogs'),
        fetch('/api/comments?pending=true'),
      ])

      if (blogsRes.ok && commentsRes.ok) {
        const blogs = await blogsRes.json()
        const comments = await commentsRes.json()
        setStats({
          totalVisits: 0,
          totalBlogs: blogs.length,
          pendingComments: comments.length,
        })
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
          }}
        >
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>
              Admin Dashboard
            </h1>
            <p style={{ fontSize: '16px', color: '#6B7280' }}>Welcome back, {session?.user?.name}</p>
          </div>
          <Link
            href="/admin/blog/new"
            style={{
              padding: '12px 24px',
              backgroundColor: '#EAB308',
              color: '#111827',
              fontSize: '16px',
              fontWeight: 600,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            + New Blog
          </Link>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '32px',
          }}
        >
          {[
            { label: 'Total Blog Posts', value: stats.totalBlogs, color: '#3B82F6' },
            { label: 'Pending Comments', value: stats.pendingComments, color: '#F59E0B' },
            { label: 'Visitor Tracking', value: 'Active', color: '#10B981' },
          ].map((stat, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: '#FFFFFF',
                padding: '24px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              }}
            >
              <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>{stat.label}</p>
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: stat.color,
                }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Blog List */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '24px', borderBottom: '1px solid #E5E7EB' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>Recent Blog Posts</h2>
          </div>

          {blogs.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: '16px', color: '#6B7280', marginBottom: '16px' }}>
                No blog posts yet. Create your first one!
              </p>
              <Link
                href="/admin/blog/new"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#EAB308',
                  color: '#111827',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Create Blog Post
              </Link>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 600, color: '#6B7280' }}>
                    Title
                  </th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 600, color: '#6B7280' }}>
                    Status
                  </th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 600, color: '#6B7280' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {blogs.map((blog) => (
                  <tr key={blog.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '16px 24px', color: '#111827' }}>{blog.title}</td>
                    <td style={{ padding: '16px 24px', color: '#6B7280' }}>
                      <span
                        style={{
                          padding: '4px 12px',
                          backgroundColor: blog.published ? '#DBEAFE' : '#FEE2E2',
                          color: blog.published ? '#0369A1' : '#991B1B',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        {blog.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <Link
                        href={`/admin/blog/${blog.id}`}
                        style={{
                          marginRight: '12px',
                          padding: '6px 12px',
                          backgroundColor: '#3B82F6',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '12px',
                          textDecoration: 'none',
                          display: 'inline-block',
                        }}
                      >
                        Edit
                      </Link>
                      <button
                        onClick={async () => {
                          if (confirm('Delete this blog post?')) {
                            await fetch(`/api/blogs?id=${blog.id}`, { method: 'DELETE' })
                            loadBlogs()
                          }
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#EF4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Comments Management Link */}
        {stats.pendingComments > 0 && (
          <div
            style={{
              marginTop: '24px',
              padding: '16px 24px',
              backgroundColor: '#FEF3C7',
              border: '1px solid #FCD34D',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            <Link
              href="/admin/comments"
              style={{
                display: 'block',
                color: '#92400E',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              ⚠️ You have {stats.pendingComments} pending {stats.pendingComments === 1 ? 'comment' : 'comments'} to review
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
