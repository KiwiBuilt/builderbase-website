'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage'
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
  const [imageModal, setImageModal] = useState<{ src: string; alt: string; description: string; metaDesc: string; width?: string; height?: string } | null>(null)
  const [generatingImageDesc, setGeneratingImageDesc] = useState(false)
  const [galleryImages, setGalleryImages] = useState<{ url: string; name: string }[]>([])
  const [showGallerySelector, setShowGallerySelector] = useState(false)
  const [galleryLoading, setGalleryLoading] = useState(false)
  const [gallerySearch, setGallerySearch] = useState('')

  const loadGalleryImages = async () => {
    setGalleryLoading(true)
    try {
      const imagesRef = ref(storage, 'blog-images')
      const result = await listAll(imagesRef)
      const imageList = await Promise.all(
        result.items.map(async (item) => ({
          url: await getDownloadURL(item),
          name: item.name,
        }))
      )
      setGalleryImages(imageList.sort((a, b) => b.name.localeCompare(a.name)))
    } catch (error) {
      console.error('Error loading gallery images:', error)
    } finally {
      setGalleryLoading(false)
    }
  }

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

  const handleImageContextMenu = (e: Event) => {
    e.preventDefault()
    const img = e.target as HTMLImageElement
    const alt = img.alt || ''
    const width = img.style.width ? parseInt(img.style.width) : 400
    setImageModal({ src: img.src, alt, description: alt, metaDesc: img.title || '', width: width.toString(), height: undefined })
  }

  const attachImageListeners = () => {
    setTimeout(() => {
      const images = document.querySelectorAll('.ProseMirror img') as NodeListOf<HTMLImageElement>
      images.forEach((img) => {
        img.style.cursor = 'context-menu'
        img.removeEventListener('contextmenu', handleImageContextMenu as EventListener)
        img.addEventListener('contextmenu', handleImageContextMenu as EventListener)
      })
    }, 50)
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Image.configure({ inline: true }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Click to write your post...' }),
    ],
    content: blog.content || '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setBlog((prev) => ({ ...prev, content: editor.getHTML() }))
      attachImageListeners()
    },
  })

  const resizeImage = (direction: 'up' | 'down') => {
    if (!imageModal) return
    const currentWidth = parseInt(imageModal.width || '400') || 400
    const newWidth = direction === 'up' ? currentWidth + 50 : Math.max(100, currentWidth - 50)
    setImageModal({ ...imageModal, width: newWidth.toString() })
  }

  const applyImageChanges = () => {
    if (!imageModal) return
    const images = document.querySelectorAll('.ProseMirror img') as NodeListOf<HTMLImageElement>
    images.forEach((img) => {
      if (img.src === imageModal.src) {
        img.alt = imageModal.description
        img.title = imageModal.metaDesc
        if (imageModal.width) {
          img.style.width = imageModal.width + 'px'
          img.style.height = 'auto'
        }
      }
    })
    setImageModal(null)
  }

  const generateImageDescription = async () => {
    if (!imageModal?.src) return
    setGeneratingImageDesc(true)
    try {
      // Convert image to base64 using canvas to avoid CORS issues
      const img = document.createElement('img') as HTMLImageElement
      img.crossOrigin = 'anonymous'
      img.onload = async () => {
        try {
          // Use canvas to convert image to base64
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          if (!ctx) throw new Error('Cannot get canvas context')
          ctx.drawImage(img, 0, 0)
          const base64String = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
          
          console.log('Sending to API:', { type: 'image-vision', imageData: base64String?.slice(0, 50) + '...', imageType: 'image/jpeg' })
          
          const response = await fetch('/api/generateContent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'image-vision',
              imageData: base64String,
              imageType: 'image/jpeg',
              customRules: 'Keep it under 160 characters. Focus on what the image shows and its relevance to construction/building.',
            }),
          })
          
          if (!response.ok) {
            const errorData = await response.json()
            console.error('API returned error:', errorData)
            throw new Error(errorData.error || 'Failed to generate description')
          }
          
          const data = await response.json()
          console.log('API response:', data)
          const description = data.content?.replace(/<[^>]*>/g, '').slice(0, 160) || imageModal.alt
          setImageModal({ ...imageModal, metaDesc: description })
        } catch (error) {
          console.error('Error in image processing:', error)
          alert('Failed to generate description: ' + (error instanceof Error ? error.message : 'Unknown error'))
        } finally {
          setGeneratingImageDesc(false)
        }
      }
      img.onerror = () => {
        console.error('Failed to load image:', imageModal.src)
        setGeneratingImageDesc(false)
        alert('Failed to load image. Check browser console for details.')
      }
      img.src = imageModal.src
    } catch (error) {
      console.error('Error setting up image:', error)
      setGeneratingImageDesc(false)
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
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
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(7)
      const fileName = `${timestamp}-${randomId}-${file.name}`
      const fileRef = ref(storage, `blog-images/${fileName}`)
      await uploadBytes(fileRef, file)
      const url = await getDownloadURL(fileRef)
      editor?.chain().focus().setImage({ src: url }).run()
      // Refresh gallery list
      await loadGalleryImages()
      alert('✅ Image uploaded to gallery and added to blog!')
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Error uploading image')
    } finally {
      setUploading(false)
    }
  }

  const addImageFromGallery = (imageUrl: string) => {
    editor?.chain().focus().setImage({ src: imageUrl }).run()
    setShowGallerySelector(false)
  }

  const deleteImageFromGallery = async (imageName: string) => {
    if (!confirm(`Delete this image from the gallery?`)) return
    try {
      const imageRef = ref(storage, `blog-images/${imageName}`)
      await deleteObject(imageRef)
      setGalleryImages((prev) => prev.filter((img) => img.name !== imageName))
    } catch (error) {
      console.error('Error deleting image:', error)
      alert('Error deleting image')
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

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login')
    else if (status === 'authenticated' && blogId && blogId !== 'new') loadBlog()
    else setLoading(false)
  }, [status, blogId, router])

  useEffect(() => {
    attachImageListeners()
  }, [])

  if (status === 'loading' || loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><p>Loading...</p></div>
  }
  if (status === 'unauthenticated') return null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFBFC', display: 'flex', flexDirection: 'column' }}>
      <div style={{ backgroundColor: '#FFF', borderBottom: '1px solid #E1E8ED', padding: '14px 20px' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '18px', fontWeight: '500', color: '#222', margin: 0 }}>{blog.title || 'Create a new post'}</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => handleSave(false)} disabled={saving} style={{ padding: '8px 20px', backgroundColor: '#F1F3F5', border: '1px solid #D0D7DE', borderRadius: '5px', cursor: 'pointer', fontWeight: '500', fontSize: '13px' }}>Save Draft</button>
            <button onClick={() => handleSave(true)} disabled={saving} style={{ padding: '8px 20px', backgroundColor: '#EAB308', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', color: '#111' }}>Publish</button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', maxWidth: '1600px', width: '100%', margin: '0 auto', gap: '0', overflow: 'hidden' }}>
        <div style={{ width: '260px', backgroundColor: '#FFF', borderRight: '1px solid #E1E8ED', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #E1E8ED', cursor: 'pointer' }} onClick={() => setShowAI(!showAI)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showAI ? '12px' : 0 }}>
              <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#222', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>✨ AI Generator</h3>
              <span style={{ fontSize: '12px', color: '#666' }}>{showAI ? '▼' : '▶'}</span>
            </div>
            {showAI && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="What to write..." style={{ width: '100%', padding: '9px', fontSize: '12px', border: '1px solid #D0D7DE', borderRadius: '4px', boxSizing: 'border-box' }} />
                <textarea value={topicContext} onChange={(e) => setTopicContext(e.target.value)} placeholder="Who's this for? Context?" style={{ width: '100%', padding: '9px', fontSize: '11px', border: '1px solid #D0D7DE', borderRadius: '4px', minHeight: '60px', boxSizing: 'border-box' }} />
                <button onClick={generateAIContent} disabled={generatingContent || !topic} style={{ width: '100%', padding: '10px', backgroundColor: '#228AE6', color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>{generatingContent ? '⏳...' : '🚀 Generate'}</button>
              </div>
            )}
          </div>

          <div style={{ padding: '16px', borderBottom: '1px solid #E1E8ED' }}>
            <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#222', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Add Elements</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} style={{ padding: '10px 8px', backgroundColor: '#F6F8FA', border: '1px solid #D0D7DE', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>H2</button>
              <button onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} style={{ padding: '10px 8px', backgroundColor: '#F6F8FA', border: '1px solid #D0D7DE', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>H3</button>
              <button onClick={() => editor?.chain().focus().toggleBold().run()} style={{ padding: '10px 8px', backgroundColor: '#F6F8FA', border: '1px solid #D0D7DE', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}><strong>B</strong></button>
              <button onClick={() => editor?.chain().focus().toggleItalic().run()} style={{ padding: '10px 8px', backgroundColor: '#F6F8FA', border: '1px solid #D0D7DE', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}><em>I</em></button>
              <button onClick={() => editor?.chain().focus().toggleBulletList().run()} style={{ padding: '10px 8px', backgroundColor: '#F6F8FA', border: '1px solid #D0D7DE', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>●●●</button>
              <button onClick={() => editor?.chain().focus().toggleOrderedList().run()} style={{ padding: '10px 8px', backgroundColor: '#F6F8FA', border: '1px solid #D0D7DE', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>1.2.</button>
              <button onClick={() => { setShowGallerySelector(true); loadGalleryImages(); }} style={{ padding: '10px 8px', backgroundColor: '#FFF8DC', border: '1px solid #FFD700', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>🖼️ Gallery</button>
              <button onClick={() => editor?.chain().focus().toggleBlockquote().run()} style={{ padding: '10px 8px', backgroundColor: '#F6F8FA', border: '1px solid #D0D7DE', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>❝❞</button>
            </div>
          </div>

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

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFF', overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: '4px', padding: '10px 15px', backgroundColor: '#FAFBFC', borderBottom: '1px solid #E1E8ED', alignItems: 'center' }}>
            <button onClick={() => editor?.chain().focus().toggleBold().run()} style={{ padding: '5px 9px', fontSize: '13px', fontWeight: 'bold', backgroundColor: editor?.isActive('bold') ? '#E8F0FE' : '#FFF', border: '1px solid #D0D7DE', borderRadius: '3px', cursor: 'pointer' }}>B</button>
            <button onClick={() => editor?.chain().focus().toggleItalic().run()} style={{ padding: '5px 9px', fontSize: '13px', fontStyle: 'italic', backgroundColor: editor?.isActive('italic') ? '#E8F0FE' : '#FFF', border: '1px solid #D0D7DE', borderRadius: '3px', cursor: 'pointer' }}>I</button>
            <button onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} style={{ padding: '5px 9px', fontSize: '11px', fontWeight: 'bold', backgroundColor: editor?.isActive('heading') ? '#E8F0FE' : '#FFF', border: '1px solid #D0D7DE', borderRadius: '3px', cursor: 'pointer' }}>H</button>
            <button onClick={() => editor?.chain().focus().toggleBulletList().run()} style={{ padding: '5px 9px', fontSize: '13px', backgroundColor: editor?.isActive('bulletList') ? '#E8F0FE' : '#FFF', border: '1px solid #D0D7DE', borderRadius: '3px', cursor: 'pointer' }}>●</button>
            <div style={{ width: '1px', backgroundColor: '#D0D7DE', height: '18px' }} />
            <button onClick={() => { setShowGallerySelector(true); loadGalleryImages(); }} style={{ padding: '5px 9px', fontSize: '13px', backgroundColor: '#FFF8DC', border: '1px solid #FFD700', borderRadius: '3px', cursor: 'pointer', fontWeight: '600' }}>🖼️ Gallery</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '30px 35px', fontSize: '16px', lineHeight: '1.8', color: '#222' }}>
            <style>{`
              .ProseMirror {
                min-height: 500px;
                outline: none;
                caret-color: #228AE6;
                padding: 15px 20px;
              }
              .ProseMirror:focus {
                outline: 2px solid #228AE6;
                outline-offset: -2px;
                border-radius: 4px;
              }
              .ProseMirror img {
                cursor: context-menu;
                border-radius: 4px;
                transition: border 0.2s;
                max-width: 100%;
                height: auto;
              }
              .ProseMirror img:hover {
                border: 2px solid #FFB400;
                box-shadow: 0 0 8px rgba(255, 180, 0, 0.3);
              }
            `}</style>
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {imageModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '8px', padding: '24px', maxWidth: '500px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginTop: 0, marginBottom: '8px', color: '#111' }}>Edit Image</h2>
            <small style={{ color: '#666', fontSize: '12px', display: 'block', marginBottom: '16px' }}>💡 Adjust width with up/down arrows. Edit alt text for accessibility.</small>
            
            <div style={{ marginBottom: '16px', textAlign: 'center' }}>
              <img src={imageModal.src} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px', border: '1px solid #D0D7DE' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#222' }}>Image Width</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="text" value={imageModal.width || '400'} onChange={(e) => setImageModal({ ...imageModal, width: e.target.value })} placeholder="400" style={{ flex: 1, padding: '8px', border: '1px solid #D0D7DE', borderRadius: '4px', fontSize: '13px' }} />
                <span style={{ fontSize: '12px', color: '#666' }}>px</span>
                <button onClick={() => resizeImage('up')} style={{ padding: '8px 12px', backgroundColor: '#228AE6', color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', minWidth: '40px' }}>▲</button>
                <button onClick={() => resizeImage('down')} style={{ padding: '8px 12px', backgroundColor: '#228AE6', color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', minWidth: '40px' }}>▼</button>
              </div>
              <small style={{ color: '#999', fontSize: '11px', display: 'block', marginTop: '4px' }}>Use arrows or type a pixel value (100-1000)</small>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#222' }}>Alt Text (for accessibility)</label>
              <textarea value={imageModal.description} onChange={(e) => setImageModal({ ...imageModal, description: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #D0D7DE', borderRadius: '4px', minHeight: '60px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#222' }}>Meta Description (SEO)</label>
                <button onClick={generateImageDescription} disabled={generatingImageDesc} style={{ padding: '4px 12px', backgroundColor: '#228AE6', color: '#FFF', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>
                  {generatingImageDesc ? '⏳ AI...' : '✨ AI'}
                </button>
              </div>
              <textarea value={imageModal.metaDesc} onChange={(e) => setImageModal({ ...imageModal, metaDesc: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #D0D7DE', borderRadius: '4px', minHeight: '60px', fontSize: '13px', boxSizing: 'border-box' }} maxLength={160} />
              <small style={{ color: '#999', fontSize: '11px' }}>{imageModal.metaDesc.length}/160</small>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setImageModal(null)} style={{ padding: '10px 16px', backgroundColor: '#F1F3F5', border: '1px solid #D0D7DE', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Cancel</button>
              <button onClick={applyImageChanges} style={{ padding: '10px 16px', backgroundColor: '#228AE6', color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      <input id="file-input" type="file" accept="image/*" hidden onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file) }} />

      {showGallerySelector && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '8px', padding: '24px', maxWidth: '800px', width: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#111' }}>Select or Upload Image</h2>
              <button onClick={() => setShowGallerySelector(false)} style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>×</button>
            </div>
            
            <input type="text" value={gallerySearch} onChange={(e) => setGallerySearch(e.target.value)} placeholder="Search gallery..." style={{ width: '100%', padding: '10px', marginBottom: '12px', border: '1px solid #D0D7DE', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' }} />
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button onClick={() => document.getElementById('gallery-file-input')?.click()} disabled={uploading} style={{ flex: 1, padding: '10px', backgroundColor: '#228AE6', color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                {uploading ? '⏳ Uploading...' : '➕ Upload New Image'}
              </button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px', paddingRight: '8px' }}>
              {galleryLoading ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: '#666' }}>Loading gallery...</div>
              ) : galleryImages.filter((img) => img.name.toLowerCase().includes(gallerySearch.toLowerCase())).length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: '#666' }}>No images found. Upload one to get started!</div>
              ) : (
                galleryImages.filter((img) => img.name.toLowerCase().includes(gallerySearch.toLowerCase())).map((img) => (
                  <div key={img.name} style={{ position: 'relative', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#F6F8FA', border: '2px solid transparent', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#228AE6'; e.currentTarget.style.backgroundColor = '#E8F0FE'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.backgroundColor = '#F6F8FA'; }}>
                    <img src={img.url} alt={img.name} onClick={() => addImageFromGallery(img.url)} style={{ width: '100%', height: '120px', objectFit: 'cover', cursor: 'pointer' }} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(34, 138, 230, 0.8)', opacity: 0, transition: 'opacity 0.2s', color: '#FFF', fontSize: '12px', fontWeight: '600' }} onClick={() => addImageFromGallery(img.url)} onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }} onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; }}>Click to add</div>
                    <button onClick={(e) => { e.stopPropagation(); deleteImageFromGallery(img.name); }} style={{ position: 'absolute', top: '4px', right: '4px', width: '28px', height: '28px', padding: '0', backgroundColor: '#FF4444', color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }} title="Delete image">🗑️</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <input id="gallery-file-input" type="file" accept="image/*" hidden onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file) }} />
    </div>
  )
}
