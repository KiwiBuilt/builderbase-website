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

export default function BlogEditorClean() {
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
  const [generatingContent, setGeneratingContent] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showAI, setShowAI] = useState(true)
  const [topic, setTopic] = useState('')
  const [topicContext, setTopicContext] = useState('')
  const [aiMode, setAiMode] = useState<'content' | 'title' | 'complete'>('complete')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({ inline: true }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Click to write your post...' }),
    ],
    content: blog.content || '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setBlog((prev) => ({ ...prev, content: editor.getHTML() }))
    },
  })

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login')
    else if (status === 'authenticated' && blogId && blogId !== 'new') loadBlog()
    else setLoading(false)
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

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be less than 10MB')
      return
    }

    setUploading(true)
    try {
      const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const fileRef = ref(storage, `blog-images/${filename}`)
      await uploadBytes(fileRef, file)
      const url = await getDownloadURL(fileRef)
      editor?.chain().focus().setImage({ src: url }).run()
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Error uploading image')
    } finally {
      setUploading(false)
    }
  }

  const handleTitleChange = (e: string) => {
    setBlog((prev) => ({
      ...prev,
      title: e,
      slug: e.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    }))
  }

  const generateAIContent = async () => {
    if (!topic.trim()) {
      alert('Please enter a topic')
      return
    }

    setGeneratingContent(true)
    try {
      const response = await fetch('/api/generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: aiMode,
          topic: topic.trim(),
          topicContext: topicContext.trim(),
          customRules: '',
        }),
      })

      if (!response.ok) throw new Error('Generation failed')
      const data = await response.json()

      if (aiMode === 'complete' && data.title) {
        setBlog((prev) => ({
          ...prev,
          title: data.title || prev.title,
          content: data.content || prev.content,
          metaDescription: data.metaDescription || prev.metaDescription,
          keywords: data.keywords || prev.keywords,
        }))
        editor?.commands.setContent(data.content || '')
      } else if (aiMode === 'content') {
        editor?.commands.setContent(data.content)
      } else if (aiMode === 'title') {
        setBlog((prev) => ({ ...prev, title: data.title }))
      }

      setTopic('')
      alert('✅ Post content generated!')
    } catch (error) {
      console.error('Generation error:', error)
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
      const res = await fetch('/api/blogs', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...blog, published: publish, ...(blogId && blogId !== 'new' && { id: blogId }) }),
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

  if (status === 'loading' || loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><p>Loading...</p></div>
  }

  if (status === 'unauthenticated') return null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFBFC', display: 'flex', flexDirection: 'column' }}>
      {/* CLEAN HEADER */}
      <div style={{ backgroundColor: '#FFF', borderBottom: '1px solid #E1E8ED', padding: '14px 20px' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '18px', fontWeight: '500', color: '#222', margin: 0 }}>
            {blog.title || 'Create a new post'}
          </h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => handleSave(false)} disabled={saving} style={{ padding: '8px 20px', backgroundColor: '#F1F3F5', border: '1px solid #D0D7DE', borderRadius: '5px', cursor: 'pointer', fontWeight: '500', fontSize: '13px' }}>
              Save Draft
            </button>
            <button onClick={() => handleSave(true)} disabled={saving} style={{ padding: '8px 20px', backgroundColor: '#EAB308', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', color: '#111' }}>
              Publish
            </button>
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT - SIDEBAR + EDITOR */}
      <div style={{ flex: 1, display: 'flex', maxWidth: '1600px', width: '100%', margin: '0 auto', gap: '0', overflow: 'hidden' }}>
        
        {/* LEFT SIDEBAR - WICKSTY */}
        <div style={{ width: '260px', backgroundColor: '#FFF', borderRight: '1px solid #E1E8ED', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0' }}>
          
          {/* AI SECTION */}
          <div style={{ padding: '16px', borderBottom: '1px solid #E1E8ED', cursor: 'pointer' }} onClick={() => setShowAI(!showAI)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showAI ? '12px' : 0 }}>
              <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#222', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>✨ AI Generator</h3>
              <span style={{ fontSize: '12px', color: '#666' }}>{showAI ? '▼' : '▶'}</span>
            </div>

            {showAI && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="What to write..." style={{ width: '100%', padding: '9px', fontSize: '12px', border: '1px solid #D0D7DE', borderRadius: '4px', boxSizing: 'border-box' }} />
                <textarea value={topicContext} onChange={(e) => setTopicContext(e.target.value)} placeholder="Who's this for? Context?" style={{ width: '100%', padding: '9px', fontSize: '11px', border: '1px solid #D0D7DE', borderRadius: '4px', minHeight: '60px', boxSizing: 'border-box' }} />
                <button onClick={generateAIContent} disabled={generatingContent || !topic} style={{ width: '100%', padding: '10px', backgroundColor: '#228AE6', color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>
                  {generatingContent ? '⏳...' : '🚀 Generate'}
                </button>
              </div>
            )}
          </div>

          {/* ADD ELEMENTS */}
          <div style={{ padding: '16px', borderBottom: '1px solid #E1E8ED' }}>
            <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#222', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Add Elements</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} style={{ padding: '10px 8px', backgroundColor: '#F6F8FA', border: '1px solid #D0D7DE', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>H2</button>
              <button onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} style={{ padding: '10px 8px', backgroundColor: '#F6F8FA', border: '1px solid #D0D7DE', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>H3</button>
              <button onClick={() => editor?.chain().focus().toggleBold().run()} style={{ padding: '10px 8px', backgroundColor: '#F6F8FA', border: '1px solid #D0D7DE', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}><strong>B</strong></button>
              <button onClick={() => editor?.chain().focus().toggleItalic().run()} style={{ padding: '10px 8px', backgroundColor: '#F6F8FA', border: '1px solid #D0D7DE', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}><em>I</em></button>
              <button onClick={() => editor?.chain().focus().toggleBulletList().run()} style={{ padding: '10px 8px', backgroundColor: '#F6F8FA', border: '1px solid #D0D7DE', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>●●●</button>
              <button onClick={() => editor?.chain().focus().toggleOrderedList().run()} style={{ padding: '10px 8px', backgroundColor: '#F6F8FA', border: '1px solid #D0D7DE', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>1.2.</button>
              <button onClick={() => document.getElementById('file-input')?.click()} style={{ padding: '10px 8px', backgroundColor: '#F6F8FA', border: '1px solid #D0D7DE', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>🖼️</button>
              <button onClick={() => editor?.chain().focus().toggleBlockquote().run()} style={{ padding: '10px 8px', backgroundColor: '#F6F8FA', border: '1px solid #D0D7DE', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>❝❞</button>
            </div>
          </div>

          {/* SETTINGS */}
          <div style={{ padding: '16px', borderBottom: '1px solid #E1E8ED', cursor: 'pointer' }} onClick={() => setShowSettings(!showSettings)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showSettings ? '12px' : 0 }}>
              <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#222', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Post Details</h3>
              <span style={{ fontSize: '12px', color: '#666' }}>{showSettings ? '▼' : '▶'}</span>
            </div>

            {showSettings && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                <div>
                  <small style={{ fontWeight: '600', color: '#666', display: 'block', marginBottom: '4px' }}>Title</small>
                  <input type="text" value={blog.title} onChange={(e) => handleTitleChange(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #D0D7DE', borderRadius: '4px', boxSizing: 'border-box', fontSize: '11px' }} />
                </div>
                <div>
                  <small style={{ fontWeight: '600', color: '#666', display: 'block', marginBottom: '4px' }}>Slug</small>
                  <input type="text" value={blog.slug} onChange={(e) => setBlog((prev) => ({ ...prev, slug: e.target.value }))} style={{ width: '100%', padding: '6px', border: '1px solid #D0D7DE', borderRadius: '4px', boxSizing: 'border-box', fontSize: '11px' }} />
                </div>
                <div>
                  <small style={{ fontWeight: '600', color: '#666', display: 'block', marginBottom: '4px' }}>Category</small>
                  <select value={blog.category} onChange={(e) => setBlog((prev) => ({ ...prev, category: e.target.value }))} style={{ width: '100%', padding: '6px', border: '1px solid #D0D7DE', borderRadius: '4px', fontSize: '11px' }}>
                    <option>General</option>
                    <option>Tips & Tricks</option>
                    <option>Case Studies</option>
                  </select>
                </div>
                <div>
                  <small style={{ fontWeight: '600', color: '#666', display: 'block', marginBottom: '4px' }}>Meta Description</small>
                  <textarea value={blog.metaDescription} onChange={(e) => setBlog((prev) => ({ ...prev, metaDescription: e.target.value.slice(0, 160) }))} style={{ width: '100%', padding: '6px', border: '1px solid #D0D7DE', borderRadius: '4px', minHeight: '40px', boxSizing: 'border-box', fontSize: '11px' }} maxLength={160} />
                  <small style={{ color: '#999', fontSize: '10px' }}>{blog.metaDescription.length}/160</small>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CENTER - CLEAN EDITOR */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFF', overflow: 'hidden' }}>
          {/* Simple toolbar */}
          <div style={{ display: 'flex', gap: '4px', padding: '10px 15px', backgroundColor: '#FAFBFC', borderBottom: '1px solid #E1E8ED', alignItems: 'center' }}>
            <button onClick={() => editor?.chain().focus().toggleBold().run()} style={{ padding: '5px 9px', fontSize: '13px', fontWeight: 'bold', backgroundColor: editor?.isActive('bold') ? '#E8F0FE' : '#FFF', border: '1px solid #D0D7DE', borderRadius: '3px', cursor: 'pointer' }}>B</button>
            <button onClick={() => editor?.chain().focus().toggleItalic().run()} style={{ padding: '5px 9px', fontSize: '13px', fontStyle: 'italic', backgroundColor: editor?.isActive('italic') ? '#E8F0FE' : '#FFF', border: '1px solid #D0D7DE', borderRadius: '3px', cursor: 'pointer' }}>I</button>
            <button onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} style={{ padding: '5px 9px', fontSize: '11px', fontWeight: 'bold', backgroundColor: editor?.isActive('heading') ? '#E8F0FE' : '#FFF', border: '1px solid #D0D7DE', borderRadius: '3px', cursor: 'pointer' }}>H</button>
            <button onClick={() => editor?.chain().focus().toggleBulletList().run()} style={{ padding: '5px 9px', fontSize: '13px', backgroundColor: editor?.isActive('bulletList') ? '#E8F0FE' : '#FFF', border: '1px solid #D0D7DE', borderRadius: '3px', cursor: 'pointer' }}>●</button>
            <div style={{ width: '1px', backgroundColor: '#D0D7DE', height: '18px' }} />
            <button onClick={() => document.getElementById('file-input')?.click()} style={{ padding: '5px 9px', fontSize: '13px', backgroundColor: '#FFF', border: '1px solid #D0D7DE', borderRadius: '3px', cursor: 'pointer' }}>🖼️ Image</button>
          </div>

          {/* Editor content - LARGE AND CLEAN */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '40px 60px', fontSize: '16px', lineHeight: '1.8', color: '#222' }}>
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {/* FILE INPUT */}
      <input id="file-input" type="file" accept="image/*" hidden onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file) }} />
    </div>
  )
}
