'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { BLOG_CATEGORIES, slugForTitleChange, todayInAuckland, type BlogFaq } from '@/lib/blog'
import { SITE_URL } from '@/lib/site'

const BlogImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('width'),
        renderHTML: (attributes: { width?: string | null }) => {
          if (!attributes.width) return {}
          const width = String(attributes.width).replace(/px$/i, '')
          if (!/^\d+$/.test(width)) return {}
          return { width }
        },
      },
    }
  },
})

type EditorPost = {
  title: string
  slug: string
  excerpt: string
  content: string
  metaDescription: string
  keywords: string
  category: string
  published: boolean
  featuredImage: string
  featuredImageAlt: string
  publishDate: string
  author: string
  faqs: BlogFaq[]
  slugLocked: boolean
}

type GalleryImage = { url: string; name: string }

const fieldStyle = {
  width: '100%',
  padding: '6px',
  border: '1px solid #D0D7DE',
  borderRadius: '4px',
  boxSizing: 'border-box' as const,
  fontSize: '12px',
}

function emptyPost(): EditorPost {
  return {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    metaDescription: '',
    keywords: '',
    category: 'General',
    published: false,
    featuredImage: '',
    featuredImageAlt: '',
    publishDate: todayInAuckland(),
    author: 'Builder Base',
    faqs: [],
    slugLocked: false,
  }
}

function toEditorPost(found: Record<string, unknown>): EditorPost {
  const publishDate = typeof found.publishDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(found.publishDate)
    ? found.publishDate
    : typeof found.publishedAt === 'string' && found.publishedAt.length >= 10
      ? found.publishedAt.slice(0, 10)
      : todayInAuckland()
  const category = BLOG_CATEGORIES.includes(found.category as (typeof BLOG_CATEGORIES)[number])
    ? String(found.category)
    : 'General'
  const faqs = Array.isArray(found.faqs)
    ? found.faqs
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
          question: String((item as BlogFaq).question || ''),
          answer: String((item as BlogFaq).answer || ''),
        }))
    : []
  return {
    title: String(found.title || ''),
    slug: String(found.slug || ''),
    excerpt: String(found.excerpt || ''),
    content: String(found.content || ''),
    metaDescription: String(found.metaDescription || ''),
    keywords: String(found.keywords || ''),
    category,
    published: found.published === true,
    featuredImage: String(found.featuredImage || ''),
    featuredImageAlt: String(found.featuredImageAlt || ''),
    publishDate,
    author: String(found.author || 'Builder Base'),
    faqs,
    slugLocked: found.slugLocked === true || found.published === true,
  }
}

export default function BlogEditorClean() {
  const { status } = useSession()
  const router = useRouter()
  const params = useParams()
  const blogId = params?.id as string
  const isNew = !blogId || blogId === 'new'

  const [blog, setBlog] = useState<EditorPost>(emptyPost)
  const [loadedHtml, setLoadedHtml] = useState<string | null>(isNew ? '' : null)
  const [loading, setLoading] = useState(!isNew)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [generatingContent, setGeneratingContent] = useState(false)
  const [showSettings, setShowSettings] = useState(true)
  const [showAI, setShowAI] = useState(true)
  const [topic, setTopic] = useState('')
  const [topicContext, setTopicContext] = useState('')
  const [aiMode, setAiMode] = useState<'content' | 'title' | 'complete'>('complete')
  const [imageModal, setImageModal] = useState<{ src: string; alt: string; description: string; metaDesc: string; width?: string } | null>(null)
  const [generatingImageDesc, setGeneratingImageDesc] = useState(false)
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([])
  const [showGallerySelector, setShowGallerySelector] = useState(false)
  const [galleryMode, setGalleryMode] = useState<'body' | 'featured'>('body')
  const [galleryLoading, setGalleryLoading] = useState(false)
  const [gallerySearch, setGallerySearch] = useState('')
  const [pendingAlt, setPendingAlt] = useState('')

  const attachImageListeners = () => {
    setTimeout(() => {
      const images = document.querySelectorAll('.ProseMirror img')
      images.forEach((node) => {
        const img = node as HTMLImageElement
        img.style.cursor = 'context-menu'
        img.setAttribute('crossOrigin', 'anonymous')
        img.oncontextmenu = (event) => {
          event.preventDefault()
          const width = img.getAttribute('width') || (img.style.width ? String(parseInt(img.style.width, 10)) : '400')
          setImageModal({
            src: img.src,
            alt: img.alt || '',
            description: img.alt || '',
            metaDesc: img.title || '',
            width,
          })
        }
      })
    }, 50)
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      BlogImage.configure({ inline: true }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Write the post. The title is already the page heading, so start with H2.' }),
    ],
    content: '',
    immediatelyRender: false,
    editorProps: {
      transformPastedHTML(html) {
        return html.replace(/<(\/?)h1\b/gi, '<$1h2')
      },
    },
    onUpdate: ({ editor: current }) => {
      setBlog((prev) => ({ ...prev, content: current.getHTML() }))
      attachImageListeners()
    },
  })

  useEffect(() => {
    if (!editor || loadedHtml === null) return
    const current = editor.getHTML()
    if (current === loadedHtml) return
    const untouched = current === '' || current === '<p></p>'
    if (!untouched) return
    editor.commands.setContent(loadedHtml, { emitUpdate: false })
    attachImageListeners()
  }, [editor, loadedHtml])

  const loadGalleryImages = async () => {
    setGalleryLoading(true)
    try {
      const res = await fetch('/api/gallery', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not load the gallery')
      setGalleryImages(Array.isArray(data.images) ? data.images : [])
    } catch (error) {
      console.error('Error loading gallery images:', error)
      alert(error instanceof Error ? error.message : 'Could not load the gallery')
    } finally {
      setGalleryLoading(false)
    }
  }

  const openGallery = (mode: 'body' | 'featured') => {
    setGalleryMode(mode)
    setPendingAlt(mode === 'featured' ? blog.featuredImageAlt : '')
    setShowGallerySelector(true)
    loadGalleryImages()
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
      return
    }
    if (status !== 'authenticated' || isNew) {
      if (status !== 'loading') setLoading(false)
      return
    }
    let cancelled = false
    const loadBlog = async () => {
      try {
        const res = await fetch(`/api/blogs?id=${blogId}`, { cache: 'no-store' })
        const found = await res.json().catch(() => ({}))
        if (!res.ok) {
          if (!cancelled) setLoadError(found.error || 'Could not load this post.')
          return
        }
        if (!cancelled && found?.id) {
          const next = toEditorPost(found)
          setBlog(next)
          setLoadedHtml(next.content)
        }
      } catch (error) {
        console.error('Error loading blog:', error)
        if (!cancelled) setLoadError('Could not load this post.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadBlog()
    return () => {
      cancelled = true
    }
  }, [status, blogId, isNew, router])

  const resizeImage = (direction: 'up' | 'down') => {
    if (!imageModal) return
    const currentWidth = parseInt(imageModal.width || '400', 10) || 400
    const newWidth = direction === 'up' ? Math.min(1000, currentWidth + 50) : Math.max(100, currentWidth - 50)
    setImageModal({ ...imageModal, width: String(newWidth) })
  }

  const applyImageChanges = () => {
    if (!editor || !imageModal) return
    const { state } = editor
    let tr = state.tr
    const width = (imageModal.width || '').replace(/px$/i, '')
    state.doc.descendants((node, pos) => {
      if (node.type.name === 'image' && node.attrs.src === imageModal.src) {
        tr = tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          alt: imageModal.description.trim(),
          title: imageModal.metaDesc.trim(),
          width: /^\d+$/.test(width) ? width : null,
        })
      }
    })
    if (tr.docChanged) editor.view.dispatch(tr)
    setBlog((prev) => ({ ...prev, content: editor.getHTML() }))
    setImageModal(null)
  }

  const generateImageDescription = async () => {
    if (!imageModal?.src) return
    setGeneratingImageDesc(true)
    try {
      const imgElement = document.querySelector(`img[src="${imageModal.src}"]`) as HTMLImageElement | null
      if (!imgElement || imgElement.naturalWidth === 0) throw new Error('Image not found or not loaded in editor')
      const canvas = document.createElement('canvas')
      canvas.width = imgElement.naturalWidth
      canvas.height = imgElement.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Cannot get canvas context')
      ctx.drawImage(imgElement, 0, 0)
      const base64String = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
      const response = await fetch('/api/generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'image-vision',
          prompt: 'Describe this image for alt text',
          imageData: base64String,
          imageType: 'image/jpeg',
          customRules: 'Keep it under 160 characters. Focus on what the image shows.',
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Failed to generate description')
      const description = String(data.content || '').replace(/<[^>]*>/g, '').slice(0, 160)
      setImageModal({ ...imageModal, metaDesc: description, description: imageModal.description || description })
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to generate description')
    } finally {
      setGeneratingImageDesc(false)
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
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/gallery', { method: 'POST', body: form })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.image?.url) throw new Error(data.error || 'Error uploading image')
      const image = data.image as GalleryImage
      setGalleryImages((prev) => [image, ...prev])
      if (galleryMode === 'featured') {
        setBlog((prev) => ({ ...prev, featuredImage: image.url, featuredImageAlt: pendingAlt.trim() || prev.featuredImageAlt }))
        setShowGallerySelector(false)
      } else if (pendingAlt.trim()) {
        editor?.chain().focus().setImage({ src: image.url, alt: pendingAlt.trim() }).run()
        setShowGallerySelector(false)
      }
      alert('Image uploaded to the gallery.')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error uploading image')
    } finally {
      setUploading(false)
    }
  }

  const addImageFromGallery = (imageUrl: string) => {
    const alt = pendingAlt.trim()
    if (galleryMode === 'featured') {
      setBlog((prev) => ({ ...prev, featuredImage: imageUrl, featuredImageAlt: alt || prev.featuredImageAlt }))
      setShowGallerySelector(false)
      return
    }
    if (!alt) {
      alert('Add alt text before inserting the image. It is saved in the post HTML.')
      return
    }
    editor?.chain().focus().setImage({ src: imageUrl, alt }).run()
    setShowGallerySelector(false)
  }

  const deleteImageFromGallery = async (imageName: string) => {
    if (!confirm('Delete this image from the gallery?')) return
    try {
      const res = await fetch(`/api/gallery?name=${encodeURIComponent(imageName)}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Error deleting image')
      setGalleryImages((prev) => prev.filter((img) => img.name !== imageName))
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error deleting image')
    }
  }

  const handleTitleChange = (title: string) => {
    setBlog((prev) => ({
      ...prev,
      title,
      slug: slugForTitleChange({
        previousTitle: prev.title,
        nextTitle: title,
        currentSlug: prev.slug,
        slugLocked: prev.slugLocked,
      }),
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
          prompt: topic.trim(),
          type: aiMode,
          topicContext: topicContext.trim(),
          category: blog.category,
          customRules: '',
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Generation failed')
      if (aiMode === 'complete') {
        const nextTitle = data.title || blog.title
        setBlog((prev) => ({
          ...prev,
          title: nextTitle,
          content: data.content || prev.content,
          metaDescription: data.metaDescription || prev.metaDescription,
          keywords: data.keywords || prev.keywords,
          excerpt: data.excerpt || prev.excerpt,
          slug: slugForTitleChange({
            previousTitle: prev.title,
            nextTitle,
            currentSlug: prev.slug,
            slugLocked: prev.slugLocked,
          }),
        }))
        if (data.content) editor?.commands.setContent(data.content, { emitUpdate: false })
      } else if (aiMode === 'content' && data.content) {
        editor?.commands.setContent(data.content)
      } else if (aiMode === 'title' && data.title) {
        handleTitleChange(data.title)
      }
      setTopic('')
      alert('Post content generated. Review it before publishing.')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to generate content')
    } finally {
      setGeneratingContent(false)
    }
  }

  const handleSave = async (publish: boolean) => {
    const content = editor?.getHTML() || blog.content
    const faqs = blog.faqs
      .map((faq) => ({ question: faq.question.trim(), answer: faq.answer.trim() }))
      .filter((faq) => faq.question || faq.answer)
    if (!blog.title.trim() || !blog.slug.trim()) {
      alert('Title and slug are required')
      setShowSettings(true)
      return
    }
    if (publish && !blog.metaDescription.trim()) {
      alert('Add a meta description before publishing.')
      setShowSettings(true)
      return
    }
    if (publish && blog.featuredImage && !blog.featuredImageAlt.trim()) {
      alert('Add alt text for the hero image before publishing.')
      setShowSettings(true)
      return
    }
    setSaving(true)
    try {
      const method = isNew ? 'POST' : 'PUT'
      const res = await fetch('/api/blogs', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...blog,
          content,
          faqs,
          published: publish,
          ...(isNew ? {} : { id: blogId }),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(data.error || 'Error saving blog post')
        return
      }
      router.push('/admin/dashboard')
    } catch (error) {
      console.error('Error saving:', error)
      alert('Error saving blog post')
    } finally {
      setSaving(false)
    }
  }

  const updateFaq = (index: number, patch: Partial<BlogFaq>) => {
    setBlog((prev) => ({
      ...prev,
      faqs: prev.faqs.map((faq, faqIndex) => (faqIndex === index ? { ...faq, ...patch } : faq)),
    }))
  }

  if (status === 'loading' || loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><p>Loading...</p></div>
  }
  if (status === 'unauthenticated') return null
  if (loadError) {
    return (
      <div style={{ maxWidth: '640px', margin: '80px auto', padding: '24px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '12px' }}>Could not open this post</h1>
        <p style={{ color: '#374151', lineHeight: 1.5 }}>{loadError}</p>
        <button onClick={() => router.push('/admin/dashboard')} style={{ marginTop: '16px', padding: '8px 16px' }}>Back to dashboard</button>
      </div>
    )
  }

  const snippetUrl = `${SITE_URL}/blog/${blog.slug || 'your-post'}`

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFBFC', display: 'flex', flexDirection: 'column' }}>
      <div style={{ backgroundColor: '#FFF', borderBottom: '1px solid #E1E8ED', padding: '14px 20px' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: '500', color: '#222', margin: 0 }}>{blog.title || 'Create a new post'}</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => router.push('/admin/dashboard')} style={{ padding: '8px 16px', backgroundColor: '#FFF', border: '1px solid #D0D7DE', borderRadius: '5px', cursor: 'pointer', fontSize: '13px' }}>Back</button>
            <button onClick={() => handleSave(false)} disabled={saving} style={{ padding: '8px 20px', backgroundColor: '#F1F3F5', border: '1px solid #D0D7DE', borderRadius: '5px', cursor: 'pointer', fontWeight: '500', fontSize: '13px' }}>Save Draft</button>
            <button onClick={() => handleSave(true)} disabled={saving} style={{ padding: '8px 20px', backgroundColor: '#EAB308', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', color: '#111' }}>Publish</button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', maxWidth: '1600px', width: '100%', margin: '0 auto', overflow: 'hidden' }}>
        <div style={{ width: '320px', backgroundColor: '#FFF', borderRight: '1px solid #E1E8ED', overflowY: 'auto' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #E1E8ED' }}>
            <div onClick={() => setShowSettings(!showSettings)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: showSettings ? '12px' : 0 }}>
              <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#222', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Post Details</h3>
              <span style={{ fontSize: '12px', color: '#666' }}>{showSettings ? '▼' : '▶'}</span>
            </div>
            {showSettings && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#444' }}>Title
                  <input value={blog.title} onChange={(e) => handleTitleChange(e.target.value)} style={{ ...fieldStyle, marginTop: '4px' }} />
                </label>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#444' }}>Slug
                  <input
                    value={blog.slug}
                    disabled={blog.slugLocked}
                    onChange={(e) => setBlog((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-') }))}
                    style={{ ...fieldStyle, marginTop: '4px', backgroundColor: blog.slugLocked ? '#F3F4F6' : '#FFF' }}
                  />
                </label>
                {blog.slugLocked ? <small style={{ color: '#6B7280', fontSize: '11px' }}>This URL is locked because the post has been published.</small> : <small style={{ color: '#6B7280', fontSize: '11px' }}>The slug follows the title until you edit it or publish.</small>}
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#444' }}>Excerpt
                  <textarea value={blog.excerpt} onChange={(e) => setBlog((prev) => ({ ...prev, excerpt: e.target.value.slice(0, 300) }))} style={{ ...fieldStyle, marginTop: '4px', minHeight: '56px' }} />
                </label>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#444' }}>Category
                  <select value={blog.category} onChange={(e) => setBlog((prev) => ({ ...prev, category: e.target.value }))} style={{ ...fieldStyle, marginTop: '4px' }}>
                    {BLOG_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
                  </select>
                </label>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#444' }}>Author
                  <input value={blog.author} onChange={(e) => setBlog((prev) => ({ ...prev, author: e.target.value }))} style={{ ...fieldStyle, marginTop: '4px' }} />
                </label>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#444' }}>Publish date
                  <input type="date" value={blog.publishDate} onChange={(e) => setBlog((prev) => ({ ...prev, publishDate: e.target.value }))} style={{ ...fieldStyle, marginTop: '4px' }} />
                </label>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#444' }}>Meta description (required to publish)
                  <textarea value={blog.metaDescription} maxLength={160} onChange={(e) => setBlog((prev) => ({ ...prev, metaDescription: e.target.value.slice(0, 160) }))} style={{ ...fieldStyle, marginTop: '4px', minHeight: '64px' }} />
                </label>
                <small style={{ color: blog.metaDescription.trim() ? '#6B7280' : '#B45309', fontSize: '11px' }}>{blog.metaDescription.length}/160</small>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#444' }}>Keywords
                  <input value={blog.keywords} onChange={(e) => setBlog((prev) => ({ ...prev, keywords: e.target.value }))} placeholder="job costing, site diary" style={{ ...fieldStyle, marginTop: '4px' }} />
                </label>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#444', marginBottom: '4px' }}>Hero image</div>
                  {blog.featuredImage ? <img src={blog.featuredImage} alt={blog.featuredImageAlt || ''} style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: '4px', marginBottom: '6px' }} /> : null}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button type="button" onClick={() => openGallery('featured')} style={{ flex: 1, padding: '6px', fontSize: '12px', cursor: 'pointer' }}>Choose from gallery</button>
                    {blog.featuredImage ? <button type="button" onClick={() => setBlog((prev) => ({ ...prev, featuredImage: '', featuredImageAlt: '' }))} style={{ padding: '6px', fontSize: '12px', cursor: 'pointer' }}>Remove</button> : null}
                  </div>
                  <input value={blog.featuredImageAlt} onChange={(e) => setBlog((prev) => ({ ...prev, featuredImageAlt: e.target.value }))} placeholder="Hero image alt text" style={{ ...fieldStyle, marginTop: '6px' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#444' }}>FAQ</span>
                    <button type="button" onClick={() => setBlog((prev) => ({ ...prev, faqs: [...prev.faqs, { question: '', answer: '' }] }))} style={{ fontSize: '11px', cursor: 'pointer' }}>Add</button>
                  </div>
                  {blog.faqs.map((faq, index) => (
                    <div key={index} style={{ marginTop: '8px', padding: '8px', border: '1px solid #E5E7EB', borderRadius: '4px' }}>
                      <input value={faq.question} onChange={(e) => updateFaq(index, { question: e.target.value })} placeholder="Question" style={{ ...fieldStyle, marginBottom: '6px' }} />
                      <textarea value={faq.answer} onChange={(e) => updateFaq(index, { answer: e.target.value })} placeholder="Answer" style={{ ...fieldStyle, minHeight: '48px' }} />
                      <button type="button" onClick={() => setBlog((prev) => ({ ...prev, faqs: prev.faqs.filter((_, faqIndex) => faqIndex !== index) }))} style={{ marginTop: '4px', fontSize: '11px', cursor: 'pointer' }}>Remove</button>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', marginBottom: '6px' }}>SEARCH SNIPPET</div>
                  <div style={{ color: '#1a0dab', fontSize: '14px', lineHeight: 1.3 }}>{blog.title || 'Post title'}</div>
                  <div style={{ color: '#006621', fontSize: '12px', margin: '2px 0 4px' }}>{snippetUrl}</div>
                  <div style={{ color: '#4b5563', fontSize: '12px', lineHeight: 1.4 }}>{blog.metaDescription || 'Add a meta description to preview the Google snippet.'}</div>
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: '16px', borderBottom: '1px solid #E1E8ED' }}>
            <div onClick={() => setShowAI(!showAI)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: showAI ? '12px' : 0 }}>
              <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#222', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Generator</h3>
              <span style={{ fontSize: '12px', color: '#666' }}>{showAI ? '▼' : '▶'}</span>
            </div>
            {showAI && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <select value={aiMode} onChange={(e) => setAiMode(e.target.value as 'content' | 'title' | 'complete')} style={fieldStyle}>
                  <option value="complete">Full post</option>
                  <option value="content">Body only</option>
                  <option value="title">Title only</option>
                </select>
                <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="What to write..." style={fieldStyle} />
                <textarea value={topicContext} onChange={(e) => setTopicContext(e.target.value)} placeholder="Who is this for?" style={{ ...fieldStyle, minHeight: '60px' }} />
                <button onClick={generateAIContent} disabled={generatingContent || !topic.trim()} style={{ width: '100%', padding: '10px', backgroundColor: '#228AE6', color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}>{generatingContent ? 'Generating...' : 'Generate'}</button>
              </div>
            )}
          </div>

          <div style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#222', margin: '0 0 12px 0', textTransform: 'uppercase' }}>Add elements</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} style={{ padding: '8px', cursor: 'pointer' }}>H2</button>
              <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} style={{ padding: '8px', cursor: 'pointer' }}>H3</button>
              <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()} style={{ padding: '8px', cursor: 'pointer' }}><strong>B</strong></button>
              <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()} style={{ padding: '8px', cursor: 'pointer' }}><em>I</em></button>
              <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()} style={{ padding: '8px', cursor: 'pointer' }}>List</button>
              <button type="button" onClick={() => editor?.chain().focus().toggleOrderedList().run()} style={{ padding: '8px', cursor: 'pointer' }}>1. 2.</button>
              <button type="button" onClick={() => openGallery('body')} style={{ padding: '8px', cursor: 'pointer', background: '#FFF8DC' }}>Gallery</button>
              <button type="button" onClick={() => editor?.chain().focus().toggleBlockquote().run()} style={{ padding: '8px', cursor: 'pointer' }}>Quote</button>
            </div>
            <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '10px' }}>Right-click an image to edit its alt text. The alt text is stored in the saved HTML. Do not add another H1.</p>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFF', overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: '4px', padding: '10px 15px', backgroundColor: '#FAFBFC', borderBottom: '1px solid #E1E8ED', alignItems: 'center' }}>
            <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()} style={{ padding: '5px 9px', fontWeight: 'bold', cursor: 'pointer' }}>B</button>
            <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()} style={{ padding: '5px 9px', fontStyle: 'italic', cursor: 'pointer' }}>I</button>
            <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} style={{ padding: '5px 9px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>H2</button>
            <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} style={{ padding: '5px 9px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>H3</button>
            <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()} style={{ padding: '5px 9px', cursor: 'pointer' }}>List</button>
            <button type="button" onClick={() => openGallery('body')} style={{ padding: '5px 9px', backgroundColor: '#FFF8DC', cursor: 'pointer', fontWeight: 600 }}>Gallery</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
            <style>{`
              .ProseMirror { min-height: 500px; outline: none; caret-color: #228AE6; padding: 15px 20px; }
              .ProseMirror:focus { outline: 2px solid #228AE6; outline-offset: -2px; border-radius: 4px; }
              .ProseMirror h2 { font-size: 1.5rem; margin: 1rem 0 0.5rem; }
              .ProseMirror h3 { font-size: 1.2rem; margin: 0.8rem 0 0.4rem; }
              .ProseMirror p { margin: 0 0 0.75rem; }
              .ProseMirror img { cursor: context-menu; border-radius: 4px; max-width: 100%; height: auto; }
            `}</style>
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {imageModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '8px', padding: '24px', maxWidth: '500px', width: '90%' }}>
            <h2 style={{ fontSize: '18px', marginTop: 0 }}>Edit image</h2>
            <img src={imageModal.src} alt="" style={{ maxWidth: '100%', maxHeight: '180px', display: 'block', margin: '0 auto 12px' }} />
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Width
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <input value={imageModal.width || ''} onChange={(e) => setImageModal({ ...imageModal, width: e.target.value })} style={{ ...fieldStyle, fontSize: '13px' }} />
                <button type="button" onClick={() => resizeImage('up')}>+</button>
                <button type="button" onClick={() => resizeImage('down')}>-</button>
              </div>
            </label>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Alt text
              <textarea value={imageModal.description} onChange={(e) => setImageModal({ ...imageModal, description: e.target.value })} style={{ ...fieldStyle, fontSize: '13px', minHeight: '60px', marginTop: '4px' }} />
            </label>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600 }}>Title
              <textarea value={imageModal.metaDesc} maxLength={160} onChange={(e) => setImageModal({ ...imageModal, metaDesc: e.target.value })} style={{ ...fieldStyle, fontSize: '13px', minHeight: '50px', marginTop: '4px' }} />
            </label>
            <button type="button" onClick={generateImageDescription} disabled={generatingImageDesc} style={{ marginTop: '8px' }}>{generatingImageDesc ? 'Working...' : 'Suggest text with AI'}</button>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button type="button" onClick={() => setImageModal(null)}>Cancel</button>
              <button type="button" onClick={applyImageChanges} style={{ background: '#228AE6', color: '#FFF', border: 'none', padding: '8px 14px', borderRadius: '4px' }}>Save into post</button>
            </div>
          </div>
        </div>
      )}

      {showGallerySelector && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '8px', padding: '24px', maxWidth: '800px', width: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>{galleryMode === 'featured' ? 'Choose the hero image' : 'Insert an image'}</h2>
              <button type="button" onClick={() => setShowGallerySelector(false)} style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
            </div>
            <input value={pendingAlt} onChange={(e) => setPendingAlt(e.target.value)} placeholder="Alt text for this image" style={{ ...fieldStyle, margin: '12px 0', fontSize: '13px' }} />
            <input value={gallerySearch} onChange={(e) => setGallerySearch(e.target.value)} placeholder="Search gallery..." style={{ ...fieldStyle, marginBottom: '12px', fontSize: '13px' }} />
            <button type="button" onClick={() => document.getElementById('gallery-file-input')?.click()} disabled={uploading} style={{ marginBottom: '12px', padding: '10px', background: '#228AE6', color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{uploading ? 'Uploading...' : 'Upload new image'}</button>
            <div style={{ overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
              {galleryLoading ? <p>Loading gallery...</p> : galleryImages.filter((img) => img.name.toLowerCase().includes(gallerySearch.toLowerCase())).map((img) => (
                <div key={img.name} style={{ position: 'relative' }}>
                  <img src={img.url} alt={img.name} onClick={() => addImageFromGallery(img.url)} style={{ width: '100%', height: '120px', objectFit: 'cover', cursor: 'pointer' }} />
                  <button type="button" onClick={() => deleteImageFromGallery(img.name)} style={{ position: 'absolute', top: 4, right: 4 }} title="Delete image">Delete</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <input id="gallery-file-input" type="file" accept="image/*" hidden onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file); e.target.value = '' }} />
    </div>
  )
}
