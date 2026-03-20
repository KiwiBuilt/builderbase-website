'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function BlogPostPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [blog, setBlog] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [commentForm, setCommentForm] = useState({
    name: '',
    email: '',
    content: '',
  })
  const [commentSuccess, setCommentSuccess] = useState(false)

  useEffect(() => {
    loadBlog()
  }, [slug])

  const loadBlog = async () => {
    try {
      // Fetch all blogs and find by slug
      const res = await fetch('/api/blogs')
      if (res.ok) {
        const blogs = await res.json()
        const blog = blogs.find((b: any) => b.slug === slug)
        if (blog) {
          setBlog(blog)
          loadComments(blog.id)
          // Track page view
          await fetch('/api/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              page: `/blog/${slug}`,
              blogId: blog.id,
              referrer: document.referrer,
            }),
          })
        }
      }
    } catch (error) {
      console.error('Error loading blog:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadComments = async (blogId: string) => {
    try {
      const res = await fetch(`/api/comments?blogId=${blogId}`)
      if (res.ok) {
        const data = await res.json()
        setComments(data)
      }
    } catch (error) {
      console.error('Error loading comments:', error)
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!blog) return

    setSubmittingComment(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogId: blog.id,
          name: commentForm.name,
          email: commentForm.email,
          content: commentForm.content,
        }),
      })

      if (res.ok) {
        setCommentForm({ name: '', email: '', content: '' })
        setCommentSuccess(true)
        setTimeout(() => setCommentSuccess(false), 5000)
        // Reload comments (will only show approved ones)
        loadComments(blog.id)
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setSubmittingComment(false)
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
        <p style={{ fontSize: '16px', color: '#6B7280' }}>Loading blog post...</p>
      </div>
    )
  }

  if (!blog) {
    return (
      <div style={{ minHeight: '60vh', backgroundColor: '#F9FAFB', padding: '48px 16px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
            Blog post not found
          </h1>
          <Link
            href="/blog"
            style={{
              color: '#EAB308',
              textDecoration: 'none',
              fontWeight: '600',
            }}
          >
            ← Back to all posts
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      {/* Header Navigation */}
      <div style={{ padding: '16px', backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Link
            href="/blog"
            style={{
              color: '#EAB308',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            ← Back to blog
          </Link>
        </div>
      </div>

      {/* Featured Image */}
      {blog.featuredImage && (
        <div style={{ width: '100%', height: '400px', overflow: 'hidden', backgroundColor: '#E5E7EB' }}>
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

      {/* Post Content */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 16px' }}>
        <article>
          <header style={{ marginBottom: '32px' }}>
            <h1
              style={{
                fontSize: '40px',
                fontWeight: 'bold',
                color: '#111827',
                marginBottom: '16px',
              }}
            >
              {blog.title}
            </h1>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                fontSize: '14px',
                color: '#6B7280',
                paddingBottom: '16px',
                borderBottom: '1px solid #E5E7EB',
              }}
            >
              <span>
                {new Date(blog.createdAt).toLocaleDateString('en-NZ', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <span>•</span>
              <span>{blog.views || 0} views</span>
            </div>
          </header>

          {/* Content */}
          <div
            style={{
              fontSize: '16px',
              lineHeight: '1.8',
              color: '#374151',
              marginBottom: '48px',
            }}
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </article>

        {/* Comments Section */}
        <section style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid #E5E7EB' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '24px' }}>
            Comments ({comments.length})
          </h2>

          {/* Comment Form */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '24px',
              borderRadius: '12px',
              marginBottom: '32px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#111827' }}>
              Leave a Comment
            </h3>

            {commentSuccess && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#DBEAFE',
                  border: '1px solid #7DD3FC',
                  borderRadius: '6px',
                  color: '#0369A1',
                  marginBottom: '16px',
                  fontSize: '14px',
                }}
              >
                ✓ Thanks for your comment! It will appear once approved.
              </div>
            )}

            <form onSubmit={handleCommentSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '6px',
                    color: '#374151',
                  }}
                >
                  Name
                </label>
                <input
                  type="text"
                  value={commentForm.name}
                  onChange={(e) => setCommentForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
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

              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '6px',
                    color: '#374151',
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={commentForm.email}
                  onChange={(e) => setCommentForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
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

              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '6px',
                    color: '#374151',
                  }}
                >
                  Comment
                </label>
                <textarea
                  value={commentForm.content}
                  onChange={(e) => setCommentForm((prev) => ({ ...prev, content: e.target.value }))}
                  required
                  minLength={10}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    minHeight: '120px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submittingComment}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#EAB308',
                  color: '#111827',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  opacity: submittingComment ? 0.7 : 1,
                }}
              >
                {submittingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </form>
          </div>

          {/* Comments List */}
          <div style={{ gap: '16px' }}>
            {comments.length === 0 ? (
              <p style={{ color: '#6B7280', fontSize: '14px' }}>
                No comments yet. Be the first to comment!
              </p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  style={{
                    padding: '20px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <div style={{ marginBottom: '8px' }}>
                    <p style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>
                      {comment.name}
                    </p>
                    <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '4px 0 0 0' }}>
                      {new Date(comment.createdAt).toLocaleDateString('en-NZ', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '8px 0 0 0' }}>
                    {comment.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
