'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { ref, uploadBytes, listAll, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'

export const dynamic = 'force-dynamic'

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
    category: 'General',
    published: false,
    featuredImage: '',
  })

  const [loading, setLoading] = useState(!!blogId)
  const [saving, setSaving] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [showImageGallery, setShowImageGallery] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Image.configure({ inline: true }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Start writing your post...' }),
    ],
    content: blog.content || '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setBlog((prev) => ({ ...prev, content: editor.getHTML() }))
    },
  })

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

  // Load previously uploaded images on mount
  useEffect(() => {
    loadUploadedImages()
  }, [])

  const loadUploadedImages = async () => {
    try {
      const imagesRef = ref(storage, 'blog-images')
      const result = await listAll(imagesRef)
      const imageUrls = await Promise.all(
        result.items.map((item) => getDownloadURL(item))
      )
      setUploadedImages(imageUrls)
    } catch (error) {
      console.error('Error loading images:', error)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const timestamp = Date.now()
        const fileName = `${timestamp}-${file.name}`
        const imageRef = ref(storage, `blog-images/${fileName}`)
        await uploadBytes(imageRef, file)
        const url = await getDownloadURL(imageRef)
        setUploadedImages((prev) => [...prev, url])
      }
    } catch (error) {
      console.error('Error uploading images:', error)
      alert('Error uploading images')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const addImageToEditor = (imageUrl: string) => {
    editor?.chain().focus().setImage({ src: imageUrl }).run()
    setShowImageGallery(false)
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

          {/* Category */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
              Category
            </label>
            <select
              value={blog.category}
              onChange={(e) => setBlog((prev) => ({ ...prev, category: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            >
              <option>General</option>
              <option>Tips & Tricks</option>
              <option>Case Studies</option>
              <option>Updates</option>
              <option>Guides</option>
              <option>Industry News</option>
            </select>
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

          {/* Content Editor */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#374151' }}>
              Content * (Visual Editor with Formatting)
            </label>

            {/* Editor Toolbar */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                padding: '12px',
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '6px 6px 0 0',
                borderBottom: 'none',
              }}
            >
              <button
                onClick={() => editor?.chain().focus().toggleBold().run()}
                style={{
                  padding: '6px 12px',
                  backgroundColor: editor?.isActive('bold') ? '#EAB308' : '#FFFFFF',
                  border: '1px solid #D1D5DB',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
              >
                <strong>B</strong>
              </button>

              <button
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                style={{
                  padding: '6px 12px',
                  backgroundColor: editor?.isActive('italic') ? '#EAB308' : '#FFFFFF',
                  border: '1px solid #D1D5DB',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                <em>I</em>
              </button>

              <button
                onClick={() => editor?.chain().focus().toggleStrike().run()}
                style={{
                  padding: '6px 12px',
                  backgroundColor: editor?.isActive('strike') ? '#EAB308' : '#FFFFFF',
                  border: '1px solid #D1D5DB',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                <s>S</s>
              </button>

              <div style={{ width: '1px', backgroundColor: '#E5E7EB' }} />

              <button
                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                style={{
                  padding: '6px 12px',
                  backgroundColor: editor?.isActive('heading', { level: 2 }) ? '#EAB308' : '#FFFFFF',
                  border: '1px solid #D1D5DB',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
              >
                H2
              </button>

              <button
                onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                style={{
                  padding: '6px 12px',
                  backgroundColor: editor?.isActive('heading', { level: 3 }) ? '#EAB308' : '#FFFFFF',
                  border: '1px solid #D1D5DB',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                H3
              </button>

              <div style={{ width: '1px', backgroundColor: '#E5E7EB' }} />

              <button
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                style={{
                  padding: '6px 12px',
                  backgroundColor: editor?.isActive('bulletList') ? '#EAB308' : '#FFFFFF',
                  border: '1px solid #D1D5DB',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                • List
              </button>

              <button
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                style={{
                  padding: '6px 12px',
                  backgroundColor: editor?.isActive('orderedList') ? '#EAB308' : '#FFFFFF',
                  border: '1px solid #D1D5DB',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                1. List
              </button>

              <div style={{ width: '1px', backgroundColor: '#E5E7EB' }} />

              <label
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D1D5DB',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                🖼️ Image
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
              </label>

              {uploadedImages.length > 0 && (
                <button
                  onClick={() => setShowImageGallery(!showImageGallery)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: showImageGallery ? '#EAB308' : '#FFFFFF',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  📸 Gallery ({uploadedImages.length})
                </button>
              )}
            </div>

            {/* Image Gallery */}
            {showImageGallery && (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#F3F4F6',
                  borderLeft: '1px solid #E5E7EB',
                  borderRight: '1px solid #E5E7EB',
                  borderBottom: '1px solid #E5E7EB',
                }}
              >
                <p style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                  Click an image to insert it:
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                    gap: '8px',
                  }}
                >
                  {uploadedImages.map((imageUrl, idx) => (
                    <img
                      key={idx}
                      src={imageUrl}
                      alt={`gallery-${idx}`}
                      onClick={() => addImageToEditor(imageUrl)}
                      style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        border: '2px solid transparent',
                        transition: 'border 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#EAB308')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
                      title="Click to insert"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* TipTap Editor */}
            <div
              style={{
                border: '1px solid #D1D5DB',
                borderStyle: showImageGallery ? 'solid solid solid solid' : 'none solid solid solid',
                borderRadius: '0 0 6px 6px',
              }}
            >
              <EditorContent
                editor={editor}
                style={{
                  padding: '16px',
                  minHeight: '400px',
                  maxHeight: '600px',
                  overflow: 'auto',
                  backgroundColor: '#FFFFFF',
                  fontSize: '16px',
                  lineHeight: '1.6',
                }}
              />
            </div>

            {uploading && (
              <p style={{ fontSize: '12px', color: '#3B82F6', marginTop: '8px' }}>
                ⏳ Uploading images...
              </p>
            )}
          </div>

          {/* SEO Settings with Optimization Checklist */}
          <div
            style={{
              padding: '20px',
              backgroundColor: '#F3F4F6',
              borderRadius: '8px',
              marginBottom: '24px',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#111827' }}>
              🔍 SEO Settings & Optimization
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: '#374151',
                }}
              >
                Focus Keyword (for SEO optimization)
              </label>
              <input
                type="text"
                value={blog.keywords}
                onChange={(e) => setBlog((prev) => ({ ...prev, keywords: e.target.value }))}
                placeholder="e.g., construction management NZ, builder software"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  marginBottom: '8px',
                }}
              />
              <p style={{ fontSize: '12px', color: '#6B7280' }}>
                What should Google rank this post for?
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: '#374151',
                }}
              >
                Meta Description (160 chars - appears in Google)
              </label>
              <textarea
                value={blog.metaDescription}
                onChange={(e) =>
                  setBlog((prev) => ({
                    ...prev,
                    metaDescription: e.target.value.slice(0, 160),
                  }))
                }
                placeholder="Write a compelling summary that'll show in Google search results..."
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
                {blog.metaDescription.length} / 160 characters
              </p>
            </div>

            {/* SEO Optimization Checklist */}
            <div
              style={{
                padding: '16px',
                backgroundColor: '#FFFFFF',
                borderRadius: '6px',
                border: '1px solid #E5E7EB',
              }}
            >
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#111827' }}>
                ✅ SEO Optimization Tasks
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  {
                    done: blog.title.length > 0,
                    label: 'Add a title',
                    priority: 'CRITICAL',
                  },
                  {
                    done: blog.featuredImage.length > 0,
                    label: 'Add a featured image',
                    priority: 'HIGH',
                  },
                  {
                    done: blog.content.length > 100,
                    label: 'Write substantial content (100+ chars)',
                    priority: 'HIGH',
                  },
                  {
                    done: blog.metaDescription.length > 30,
                    label: 'Write meta description (30+ chars)',
                    priority: 'HIGH',
                  },
                  {
                    done: blog.keywords.length > 0,
                    label: 'Set focus keyword',
                    priority: 'MEDIUM',
                  },
                  {
                    done: blog.excerpt.length > 0,
                    label: 'Write an excerpt',
                    priority: 'MEDIUM',
                  },
                ].map((task, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px',
                      marginBottom: '8px',
                      backgroundColor: task.done ? '#DBEAFE' : '#FEF3C7',
                      borderRadius: '4px',
                      fontSize: '13px',
                    }}
                  >
                    <span
                      style={{
                        marginRight: '10px',
                        fontSize: '16px',
                      }}
                    >
                      {task.done ? '✅' : '⭕'}
                    </span>
                    <span style={{ flex: 1, color: task.done ? '#0369A1' : '#92400E' }}>
                      {task.label}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        padding: '2px 6px',
                        backgroundColor: task.priority === 'CRITICAL' ? '#FEE2E2' : task.priority === 'HIGH' ? '#FDD835' : '#E0E7FF',
                        color: task.priority === 'CRITICAL' ? '#991B1B' : task.priority === 'HIGH' ? '#92400E' : '#3730A3',
                        borderRadius: '3px',
                      }}
                    >
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
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
