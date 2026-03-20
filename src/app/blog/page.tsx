'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function BlogPage() {
  const [blogs, setBlogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBlogs()
  }, [])

  const loadBlogs = async () => {
    try {
      const res = await fetch('/api/blogs')
      if (res.ok) {
        const data = await res.json()
        // Filter to published blogs only
        setBlogs(data.filter((blog: any) => blog.published))
      }
    } catch (error) {
      console.error('Error loading blogs:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          backgroundColor: '#F9FAFB',
        }}
      >
        <p style={{ fontSize: '16px', color: '#6B7280' }}>Loading blog posts...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
          padding: '48px 16px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '40px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
            Blog
          </h1>
          <p style={{ fontSize: '18px', color: '#6B7280' }}>
            Tips, tricks, and insights for construction management
          </p>
        </div>
      </div>

      {/* Blog List */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 16px' }}>
        {blogs.length === 0 ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '18px', color: '#6B7280' }}>No blog posts yet. Check back soon!</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '32px',
            }}
          >
            {blogs.map((blog) => (
              <Link
                key={blog.id}
                href={`/blog/${blog.slug}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
                    ;(e.currentTarget as HTMLElement).style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                    ;(e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {/* Featured Image */}
                  {blog.featuredImage && (
                    <div style={{ width: '100%', height: '200px', overflow: 'hidden', backgroundColor: '#E5E7EB' }}>
                      <img
                        src={blog.featuredImage}
                        alt={blog.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h2
                      style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#111827',
                        marginBottom: '8px',
                      }}
                    >
                      {blog.title}
                    </h2>

                    <p
                      style={{
                        fontSize: '14px',
                        color: '#6B7280',
                        marginBottom: '16px',
                        flex: 1,
                      }}
                    >
                      {blog.excerpt}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '12px',
                        borderTop: '1px solid #E5E7EB',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '12px',
                          color: '#9CA3AF',
                        }}
                      >
                        {blog.views || 0} views
                      </span>
                      <span
                        style={{
                          fontSize: '12px',
                          color: '#EAB308',
                          fontWeight: '600',
                        }}
                      >
                        Read →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
