'use client'

import { useState } from 'react'
import type { PublicComment } from '@/lib/blog'
import { formatNzDate } from '@/lib/blog'

export default function BlogComments({
  blogId,
  initialComments,
}: {
  blogId: string
  initialComments: PublicComment[]
}) {
  const [comments, setComments] = useState(initialComments)
  const [form, setForm] = useState({ name: '', email: '', content: '' })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogId, ...form }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Could not save that comment.')
        return
      }
      setForm({ name: '', email: '', content: '' })
      setMessage('Thanks for your comment. It will appear once approved.')
      setComments(initialComments)
    } catch {
      setError('Could not save that comment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-16">
      <h2 className="text-2xl font-bold text-gray-900">Comments ({comments.length})</h2>
      <form onSubmit={onSubmit} className="mt-6 rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900">Leave a comment</h3>
        {message ? <p className="mt-3 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">{message}</p> : null}
        {error ? <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
        <label className="mt-4 block text-sm font-semibold text-gray-700">
          Name
          <input
            required
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </label>
        <label className="mt-4 block text-sm font-semibold text-gray-700">
          Email
          <input
            required
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </label>
        <label className="mt-4 block text-sm font-semibold text-gray-700">
          Comment
          <textarea
            required
            minLength={10}
            value={form.content}
            onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
            className="mt-1 min-h-28 w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="mt-4 rounded-md px-5 py-3 font-semibold text-gray-900"
          style={{ backgroundColor: '#EAB308' }}
        >
          {submitting ? 'Posting...' : 'Post comment'}
        </button>
      </form>
      <div className="mt-6">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-600">No comments yet. Be the first to comment.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="mb-4 rounded-lg bg-white p-5 shadow-sm">
              <p className="font-semibold text-gray-900">{comment.name}</p>
              {formatNzDate(comment.createdAt) ? (
                <p className="text-xs text-gray-500">{formatNzDate(comment.createdAt)}</p>
              ) : null}
              <p className="mt-2 text-sm text-gray-700">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
