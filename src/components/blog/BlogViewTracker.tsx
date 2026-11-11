'use client'

import { useEffect } from 'react'

export default function BlogViewTracker({ slug, blogId }: { slug: string; blogId: string }) {
  useEffect(() => {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: `/blog/${slug}`,
        blogId,
        referrer: document.referrer,
      }),
    }).catch(() => undefined)
  }, [slug, blogId])
  return null
}
