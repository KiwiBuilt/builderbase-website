'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import dynamicImport from 'next/dynamic'
import 'react-quill/dist/quill.snow.css'

export const dynamic = 'force-dynamic'

const ReactQuill = dynamicImport(() => import('react-quill'), { ssr: false })

export default function BlogEditor() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const blogId = params?.id as string

  const [blog, setBlog] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    metaDescription: '',
    keywords: '',
    published: false,
    featuredImage: '',
  })

  const [loading, setLoading] = useState(!!blogId)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    } else if (status === 'authenticated' && blogId && blogId !== 'new') {
      loadBlog()
    } else {
      setLoading(false)
    }
  }, [status, blogId])

  const loadBlog = async () => {
    try {
      const res = await fetch(`/api/blogs?id=${blogId}`)
      if (res.ok) {
        const blogs = await res.json()
        const blog = blogs.find((b: any) => b.id === blogId)
        if (blog) {
          setBlog(blog)
        }
      }
    } catch (error) {
      console.error('Error loading blog:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    setBlog((prev) => ({
      ...prev,
      title,
      slug: prev.slug === '' ? generateSlug(title) : prev.slug,
    }))
  }

  const handleSave = async (publish: boolean) => {
    setSaving(true)
    try {
      const method = blogId && blogId !== 'new' ? 'PUT' : 'POST'
      const body = {
        ...blog,
        published: publish,
        ...(blogId && blogId !== 'new' && { id: blogId }),
      }

      const res = await fetch('/api/blogs', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        router.push('/admin/dashboard')
      } else {
        alert('Error saving blog post')
      }
    } catch (error) {
      console.error('Error saving blog:', error)
      alert('Error saving blog post')
    } finally {
      setSaving(false)
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
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '32px',
            }}
          >
            {blogId && blogId !== 'new' ? 'Edit Blog Post' : 'Create New Blog Post'}
          </h1>

          {/* Title */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
              Title *
            </label>
            <input
              type="text"
              value={blog.title}
              onChange={handleTitleChange}
              placeholder="Blog post title"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Slug */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
              Slug *
            </label>
            <input
              type="text"
              value={blog.slug}
              onChange={(e) => setBlog((prev) => ({ ...prev, slug: e.target.value }))}
              placeholder="url-friendly-slug"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
            <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
              Will appear as: mysite.com/blog/{blog.slug}
            </p>
          </div>

          {/* Excerpt */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
              Excerpt
            </label>
            <textarea
              value={blog.excerpt}
              onChange={(e) => setBlog((prev) => ({ ...prev, excerpt: e.target.value }))}
              placeholder="Brief summary of the post..."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px',
                minHeight: '80px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Featured Image */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
              Featured Image URL
            </label>
            <input
              type="url"
              value={blog.featuredImage}
              onChange={(e) => setBlog((prev) => ({ ...prev, featuredImage: e.target.value }))}
              placeholder="https://example.com/image.jpg"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
            {blog.featuredImage && (
              <div style={{ marginTop: '12px' }}>
                <img
                  src={blog.featuredImage}
                  alt="Featured"
                  style={{ maxWidth: '200px', borderRadius: '6px' }}
                />
              </div>
            )}
          </div>

          {/* Content */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
              Content *
            </label>
            <div style={{ height: '400px', backgroundColor: '#FFFFFF' }}>
              <ReactQuill
                value={blog.content}
                onChange={(value) => setBlog((prev) => ({ ...prev, content: value }))}
                modules={{
                  toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'code-block'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['link', 'image'],
                    ['clean'],
                  ],
                }}
                style={{ height: '360px' }}
              />
            </div>
          </div>

          {/* SEO Fields */}
          <div
            style={{
              padding: '20px',
              backgroundColor: '#F3F4F6',
              borderRadius: '8px',
              marginBottom: '24px',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#111827' }}>
              SEO Settings
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: '#374151',
                }}
              >
                Meta Description (160 chars max)
              </label>
              <textarea
                value={blog.metaDescription}
                onChange={(e) =>
                  setBlog((prev) => ({
                    ...prev,
                    metaDescription: e.target.value.slice(0, 160),
                  }))
                }
                placeholder="Description for search engines..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  minHeight: '60px',
                  boxSizing: 'border-box',
                }}
              />
              <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                {blog.metaDescription.length} / 160
              </p>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: '#374151',
                }}
              >
                Keywords
              </label>
              <input
                type="text"
                value={blog.keywords}
                onChange={(e) => setBlog((prev) => ({ ...prev, keywords: e.target.value }))}
                placeholder="comma, separated, keywords"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => handleSave(false)}
              disabled={saving || !blog.title || !blog.slug || !blog.content}
              style={{
                padding: '12px 24px',
                backgroundColor: '#E5E7EB',
                color: '#111827',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: saving || !blog.title || !blog.slug || !blog.content ? 0.5 : 1,
              }}
            >
              Save as Draft
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving || !blog.title || !blog.slug || !blog.content}
              style={{
                padding: '12px 24px',
                backgroundColor: '#EAB308',
                color: '#111827',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: saving || !blog.title || !blog.slug || !blog.content ? 0.5 : 1,
              }}
            >
              {saving ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
