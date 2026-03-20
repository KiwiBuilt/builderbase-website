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

export default function BlogEditorNew() {
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
    publishDate: new Date().toISOString().split('T')[0],
    author: 'Builder Base',
  })

  const [loading, setLoading] = useState(!!blogId)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [generatingContent, setGeneratingContent] = useState(false)
  const [contentPrompt, setContentPrompt] = useState('')
  const [showAISettings, setShowAISettings] = useState(false)
  const [customRules, setCustomRules] = useState('')
  const [topicContext, setTopicContext] = useState('')
  const [aiMode, setAiMode] = useState<'content' | 'title' | 'complete'>('complete')
  const [uploadedImages, setUploadedImages] = useState<string[]>([])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
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
    } else if (status === 'authenticated') {
      if (blogId && blogId !== 'new') {
        loadBlog()
      } else {
        setLoading(false)
      }
      loadUploadedImages()
    }
  }, [status, blogId, router])

  const loadBlog = async () => {
    try {
      const res = await fetch(`/api/blogs?id=${blogId}`)
      if (res.ok) {
        const blogs = await res.json()
        const found = blogs.find((b: any) => b.id === blogId)
        if (found) setBlog(found)
      }
    } catch (error) {
      console.error('Error loading blog:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUploadedImages = async () => {
    try {
      const imagesRef = ref(storage, 'blog-images')
      const result = await listAll(imagesRef)
      const urls = await Promise.all(result.items.map((item) => getDownloadURL(item)))
      setUploadedImages(urls)
    } catch (error) {
      console.error('Error loading images:', error)
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
      console.error('Error uploading:', error)
      alert('Error uploading images')
    } finally {
      setUploading(false)
    }
  }

  const generateContent = async () => {
    if (!contentPrompt.trim()) return

    setGeneratingContent(true)
    try {
      const res = await fetch('/api/generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: contentPrompt,
          type: aiMode,
          customRules,
          topicContext,
          category: blog.category,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        
        // Handle different response types
        if (aiMode === 'complete') {
          // Auto-fill all fields
          setBlog((prev) => ({
            ...prev,
            title: data.title || prev.title,
            metaDescription: data.metaDescription || prev.metaDescription,
            keywords: data.keywords || prev.keywords,
            content: data.content || prev.content,
          }))
          if (editor && data.content) {
            editor.chain().focus().setContent(data.content).run()
          }
          alert('✅ Complete post generated! Review and adjust as needed.')
        } else if (aiMode === 'title') {
          // Auto-fill title options
          setBlog((prev) => ({
            ...prev,
            title: data.title || prev.title,
          }))
          alert(`✅ Title generated: "${data.title}"\n\nAlternatives:\n${data.alternatives?.join('\n') || 'None'}`)
        } else {
          // Just content
          editor?.chain().focus().insertContent(data.content).run()
          alert('✅ Content generated! Review and edit as needed.')
        }
        
        setContentPrompt('')
      } else {
        const error = await res.json()
        alert(`Error: ${error.error || 'Failed to generate'}`)
      }
    } catch (error) {
      console.error('Error generating content:', error)
      alert('Failed to generate content')
    } finally {
      setGeneratingContent(false)
    }
  }

  const handleSave = async (publish: boolean) => {
    if (!blog.title.trim() || !blog.slug.trim()) {
      alert('Title and slug are required')
      return
    }

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
      console.error('Error saving:', error)
      alert('Error saving blog post')
    } finally {
      setSaving(false)
    }
  }

  const readingTime = Math.ceil(blog.content.split(/\s+/).length / 200)

  if (status === 'loading' || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (status === 'unauthenticated') return null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6', display: 'flex' }}>
      {/* SIDEBAR */}
      <div
        style={{
          width: '300px',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E5E7EB',
          padding: '24px',
          overflowY: 'auto',
          maxHeight: '100vh',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px', color: '#111827' }}>
          Post Settings
        </h2>

        {/* Title */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
            Title *
          </label>
          <input
            type="text"
            value={blog.title}
            onChange={handleTitleChange}
            placeholder="Post title"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Slug */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
            Slug *
          </label>
          <input
            type="text"
            value={blog.slug}
            onChange={(e) => setBlog((prev) => ({ ...prev, slug: e.target.value }))}
            placeholder="url-slug"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
          <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
            /blog/{blog.slug}
          </p>
        </div>

        {/* Category */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
            Category
          </label>
          <select
            value={blog.category}
            onChange={(e) => setBlog((prev) => ({ ...prev, category: e.target.value }))}
            style={{
              width: '100%',
              padding: '10px',
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

        {/* Publish Date */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
            Publish Date
          </label>
          <input
            type="date"
            value={blog.publishDate}
            onChange={(e) => setBlog((prev) => ({ ...prev, publishDate: e.target.value }))}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Meta Description */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
            Meta Description (SEO)
          </label>
          <textarea
            value={blog.metaDescription}
            onChange={(e) => setBlog((prev) => ({ ...prev, metaDescription: e.target.value.slice(0, 160) }))}
            placeholder="For search engines..."
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '12px',
              minHeight: '60px',
              boxSizing: 'border-box',
            }}
            maxLength={160}
          />
          <p style={{ fontSize: '10px', color: '#6B7280', marginTop: '4px' }}>
            {blog.metaDescription.length}/160
          </p>
        </div>

        {/* Keywords */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
            Keywords
          </label>
          <input
            type="text"
            value={blog.keywords}
            onChange={(e) => setBlog((prev) => ({ ...prev, keywords: e.target.value }))}
            placeholder="keyword1, keyword2, keyword3"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '12px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Featured Image */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
            Featured Image
          </label>
          <input
            type="text"
            value={blog.featuredImage}
            onChange={(e) => setBlog((prev) => ({ ...prev, featuredImage: e.target.value }))}
            placeholder="Image URL"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '12px',
              boxSizing: 'border-box',
              marginBottom: '8px',
            }}
          />
          <button
            onClick={() => setShowImageModal(true)}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#F3F4F6',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            📁 Upload Image
          </button>
          {blog.featuredImage && (
            <img
              src={blog.featuredImage}
              alt="Featured"
              style={{ width: '100%', marginTop: '8px', borderRadius: '6px', maxHeight: '150px', objectFit: 'cover' }}
            />
          )}
        </div>

        {/* Stats */}
        <div style={{ padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '6px', marginBottom: '20px' }}>
          <p style={{ fontSize: '11px', color: '#6B7280', margin: '4px 0' }}>
            📝 {blog.content.split(/\s+/).filter(w => w.length > 0).length} words
          </p>
          <p style={{ fontSize: '11px', color: '#6B7280', margin: '4px 0' }}>
            ⏱️ {readingTime} min read
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#F3F4F6',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              opacity: saving ? 0.5 : 1,
            }}
          >
            💾 Save Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#EAB308',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              color: '#111827',
              opacity: saving ? 0.5 : 1,
            }}
          >
            ✈️ Publish
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#F3F4F6',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            👁️ Preview
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* TOP BAR */}
        <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '16px 24px' }}>
          <div style={{ maxWidth: '900px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>
              {blog.title || 'Untitled Post'}
            </h1>
            <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* EDITOR */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* AI Assistant - Topic Mode */}
            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#F0F9FF', borderLeft: '4px solid #3B82F6', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1E40AF', margin: 0 }}>
                  ✨ AI Blog Generator
                </h3>
                <button
                  onClick={() => setShowAISettings(!showAISettings)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    backgroundColor: 'transparent',
                    border: '1px solid #BFDBFE',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    color: '#1E40AF',
                  }}
                >
                  {showAISettings ? '⚙️ Hide Options' : '⚙️ More Options'}
                </button>
              </div>

              {/* AI Settings */}
              {showAISettings && (
                <div style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#E0F2FE', borderRadius: '4px', fontSize: '12px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>Generation Mode:</label>
                    <select
                      value={aiMode}
                      onChange={(e) => setAiMode(e.target.value as any)}
                      style={{ width: '100%', padding: '6px', fontSize: '11px', borderRadius: '3px', border: '1px solid #7DD3FC' }}
                    >
                      <option value="complete">⚡ Complete Post (Title + Meta + Keywords + Body)</option>
                      <option value="content">📝 Body Content Only</option>
                      <option value="title">🎯 Title Only</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>Post-Specific Rules (optional):</label>
                    <textarea
                      value={customRules}
                      onChange={(e) => setCustomRules(e.target.value)}
                      placeholder="e.g., Focus on budget tips. Include 5+ actionable steps. Add cost examples."
                      style={{
                        width: '100%',
                        padding: '6px',
                        fontSize: '11px',
                        minHeight: '50px',
                        border: '1px solid #BFDBFE',
                        borderRadius: '3px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Main Topic Input - Always visible */}
              <div style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#1E40AF', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                  📋 Topic/Subject (What do you want to write about?)
                </label>
                <input
                  type="text"
                  value={contentPrompt}
                  onChange={(e) => setContentPrompt(e.target.value)}
                  placeholder="e.g., 'How to manage construction costs on residential projects'"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #BFDBFE',
                    borderRadius: '4px',
                    fontSize: '13px',
                    marginBottom: '8px',
                    boxSizing: 'border-box',
                    backgroundColor: '#FFFFFF',
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && generateContent()}
                />
              </div>

              {/* Topic Context - Key field */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#1E40AF', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                  ℹ️ Topic Information (Who is this for? What angle?)
                </label>
                <textarea
                  value={topicContext}
                  onChange={(e) => setTopicContext(e.target.value)}
                  placeholder="e.g., 'For owner-builders doing their first residential project. Focus on common mistakes and how to avoid them. Include budget considerations for Auckland region.'"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #BFDBFE',
                    borderRadius: '4px',
                    fontSize: '12px',
                    minHeight: '70px',
                    boxSizing: 'border-box',
                    backgroundColor: '#FFFFFF',
                  }}
                />
                <p style={{ fontSize: '10px', color: '#0369A1', marginTop: '4px', margin: '4px 0 0 0' }}>
                  💡 Tip: The more detail you provide, the better the AI-generated content will be
                </p>
              </div>

              <button
                onClick={generateContent}
                disabled={generatingContent || !contentPrompt.trim()}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#3B82F6',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  opacity: generatingContent || !contentPrompt.trim() ? 0.6 : 1,
                }}
              >
                {generatingContent ? '⏳ Generating your post...' : `🚀 Generate ${aiMode === 'complete' ? 'Complete Post' : aiMode === 'title' ? 'Title' : 'Content'}`}
              </button>
            </div>

            {/* Editor Toolbar */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                padding: '12px',
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '6px 6px 0 0',
              }}
            >
              <button onClick={() => editor?.chain().focus().toggleBold().run()} title="Bold" style={{ padding: '6px 10px', fontSize: '12px', fontWeight: 'bold', backgroundColor: editor?.isActive('bold') ? '#EAB308' : '#FFF', border: '1px solid #D1D5DB', borderRadius: '4px', cursor: 'pointer' }}>B</button>
              <button onClick={() => editor?.chain().focus().toggleItalic().run()} title="Italic" style={{ padding: '6px 10px', fontSize: '12px', fontStyle: 'italic', backgroundColor: editor?.isActive('italic') ? '#EAB308' : '#FFF', border: '1px solid #D1D5DB', borderRadius: '4px', cursor: 'pointer' }}>I</button>
              <button onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2" style={{ padding: '6px 10px', fontSize: '12px', fontWeight: 'bold', backgroundColor: editor?.isActive('heading', { level: 2 }) ? '#EAB308' : '#FFF', border: '1px solid #D1D5DB', borderRadius: '4px', cursor: 'pointer' }}>H2</button>
              <button onClick={() => editor?.chain().focus().toggleBulletList().run()} title="Bullet List" style={{ padding: '6px 10px', fontSize: '12px', backgroundColor: editor?.isActive('bulletList') ? '#EAB308' : '#FFF', border: '1px solid #D1D5DB', borderRadius: '4px', cursor: 'pointer' }}>• List</button>
              <div style={{ width: '1px', backgroundColor: '#D1D5DB' }} />
              <button onClick={() => setShowImageModal(true)} title="Add Image" style={{ padding: '6px 10px', fontSize: '12px', backgroundColor: '#FFF', border: '1px solid #D1D5DB', borderRadius: '4px', cursor: 'pointer' }}>🖼️ Image</button>
            </div>

            {/* Content Editor */}
            <div
              style={{
                border: '1px solid #E5E7EB',
                borderRadius: '0 0 6px 6px',
                backgroundColor: '#FFFFFF',
                minHeight: '500px',
                padding: '24px',
              }}
            >
              <EditorContent editor={editor} style={{ fontSize: '16px', lineHeight: '1.6' }} />
            </div>
          </div>
        </div>
      </div>

      {/* IMAGE MODAL */}
      {showImageModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '8px', padding: '24px', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Insert Image</h3>

            {/* Upload */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Upload New Image</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                style={{ width: '100%' }}
              />
              {uploading && <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>Uploading...</p>}
            </div>

            {/* Gallery */}
            {uploadedImages.length > 0 && (
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Recent Uploads</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {uploadedImages.map((url, idx) => (
                    <div
                      key={idx}
                      style={{ cursor: 'pointer', position: 'relative' }}
                      onClick={() => {
                        editor?.chain().focus().setImage({ src: url }).run()
                        setShowImageModal(false)
                      }}
                    >
                      <img src={url} alt="" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowImageModal(false)}
              style={{
                width: '100%',
                padding: '10px',
                marginTop: '16px',
                backgroundColor: '#E5E7EB',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '8px', padding: '32px', maxWidth: '800px', width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>{blog.title}</h2>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>
              {blog.publishDate} • {readingTime} min read
            </p>
            {blog.featuredImage && <img src={blog.featuredImage} alt="" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '8px', marginBottom: '24px' }} />}
            <div style={{ fontSize: '16px', lineHeight: '1.8' }} dangerouslySetInnerHTML={{ __html: blog.content }} />
            <button
              onClick={() => setShowPreview(false)}
              style={{
                width: '100%',
                padding: '10px',
                marginTop: '24px',
                backgroundColor: '#E5E7EB',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
