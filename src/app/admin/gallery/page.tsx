'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ref, uploadBytes, listAll, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '@/lib/firebase'

export const dynamic = 'force-dynamic'

export default function GalleryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [images, setImages] = useState<{ url: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login')
    else if (status === 'authenticated') loadImages()
  }, [status, router])

  const loadImages = async () => {
    try {
      const imagesRef = ref(storage, 'blog-images')
      const result = await listAll(imagesRef)
      const imageList = await Promise.all(
        result.items.map(async (item) => ({
          url: await getDownloadURL(item),
          name: item.name,
        }))
      )
      setImages(imageList.sort((a, b) => b.name.localeCompare(a.name)))
    } catch (error) {
      console.error('Error loading images:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return

    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Validate file
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} is not an image`)
          continue
        }
        
        if (file.size > 10 * 1024 * 1024) {
          alert(`${file.name} is too large (max 10MB)`)
          continue
        }

        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(7)
        const fileName = `${timestamp}-${randomId}-${file.name}`
        const imageRef = ref(storage, `blog-images/${fileName}`)
        
        await uploadBytes(imageRef, file)
        const url = await getDownloadURL(imageRef)
        setImages((prev) => [{ url, name: fileName }, ...prev])
      }
    } catch (error) {
      console.error('Error uploading images:', error)
      alert('Error uploading images')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete ${name}?`)) return

    try {
      const imageRef = ref(storage, `blog-images/${name}`)
      await deleteObject(imageRef)
      setImages((prev) => prev.filter((img) => img.name !== name))
      setSelectedImage(null)
    } catch (error) {
      console.error('Error deleting image:', error)
      alert('Error deleting image')
    }
  }

  const filteredImages = images.filter((img) =>
    img.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (status === 'loading' || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (status === 'unauthenticated') return null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6', padding: '32px 16px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
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
            marginBottom: '24px',
          }}
        >
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
            🖼️ Image Gallery
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
            Manage images for your blog posts. All images are stored and available across all posts.
          </p>

          {/* Upload Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              handleImageUpload(e.dataTransfer.files)
            }}
            style={{
              border: '2px dashed',
              borderColor: dragOver ? '#EAB308' : '#D1D5DB',
              borderRadius: '8px',
              padding: '32px',
              textAlign: 'center',
              backgroundColor: dragOver ? '#FFFBEB' : '#F9FAFB',
              transition: 'all 0.2s',
              marginBottom: '24px',
              cursor: 'pointer',
            }}
          >
            <label style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📤</div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                Drag images here or click to upload
              </h3>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                Supports: JPG, PNG, WebP, GIF (Max 10MB each)
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files)}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {uploading && (
            <div style={{ padding: '16px', backgroundColor: '#DBEAFE', borderRadius: '6px', marginBottom: '24px', color: '#0369A1', fontWeight: 600 }}>
              ⏳ Uploading images...
            </div>
          )}

          {/* Search */}
          <div style={{ marginBottom: '24px' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search images by name..."
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Image Grid */}
          {filteredImages.length > 0 ? (
            <div>
              <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '16px' }}>
                {filteredImages.length} image{filteredImages.length !== 1 ? 's' : ''}
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '16px',
                }}
              >
                {filteredImages.map((img) => (
                  <div
                    key={img.name}
                    onClick={() => setSelectedImage(img.url)}
                    style={{
                      position: 'relative',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: selectedImage === img.url ? '3px solid #EAB308' : '1px solid #E5E7EB',
                      backgroundColor: '#F3F4F6',
                    }}
                  >
                    <img
                      src={img.url}
                      alt={img.name}
                      style={{
                        width: '100%',
                        height: '150px',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: '#fff',
                        padding: '8px',
                        fontSize: '10px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {img.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
              <p style={{ fontSize: '14px' }}>
                {searchTerm ? 'No images found' : 'No images yet. Upload one to get started!'}
              </p>
            </div>
          )}
        </div>

        {/* Selected Image Preview */}
        {selectedImage && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '32px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#111827' }}>
              📸 Preview & Actions
            </h2>
            <img
              src={selectedImage}
              alt="Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '400px',
                borderRadius: '8px',
                marginBottom: '16px',
                display: 'block',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedImage)
                  alert('✅ Image URL copied to clipboard!')
                }}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#3B82F6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                📋 Copy URL
              </button>
              <button
                onClick={() => {
                  const image = images.find((img) => img.url === selectedImage)
                  if (image) handleDelete(image.name)
                }}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#EF4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                🗑️ Delete
              </button>
              <button
                onClick={() => setSelectedImage(null)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
