'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'

export const dynamic = 'force-dynamic'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [blogs, setBlogs] = useState<any[]>([])
  const [stats, setStats] = useState({ totalVisits: 0, totalBlogs: 0, pendingComments: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

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

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #E5E7EB' }}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'analytics', label: '📊 Site Stats & Analytics' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid #EAB308' : 'none',
                backgroundColor: 'transparent',
                color: activeTab === tab.id ? '#EAB308' : '#6B7280',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
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
                <p style={{ padding: '24px', color: '#6B7280' }}>No blog posts yet. Create one to get started!</p>
              ) : (
                <table style={{ width: '100%' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#111827' }}>
                        Title
                      </th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#111827' }}>
                        Author
                      </th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#111827' }}>
                        Created
                      </th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#111827' }}>
                        Status
                      </th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#111827' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {blogs.map((blog) => (
                      <tr key={blog.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '16px', color: '#111827' }}>{blog.title}</td>
                        <td style={{ padding: '16px', color: '#6B7280' }}>{blog.author}</td>
                        <td style={{ padding: '16px', color: '#6B7280' }}>
                          {new Date(blog.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span
                            style={{
                              padding: '4px 12px',
                              backgroundColor: blog.published ? '#D1E7DD' : '#FFF3CD',
                              color: blog.published ? '#0B5313' : '#664D03',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 600,
                            }}
                          >
                            {blog.published ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <Link
                            href={`/admin/blog/${blog.id}`}
                            style={{
                              color: '#3B82F6',
                              textDecoration: 'none',
                              fontSize: '14px',
                              fontWeight: '600',
                            }}
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
      </div>
    </div>
  )
}
