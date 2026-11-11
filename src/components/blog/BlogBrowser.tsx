'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BLOG_CATEGORIES } from '@/lib/blog'

export type BlogCard = {
  id: string
  title: string
  slug: string
  excerpt: string
  category: string
  featuredImage: string
  featuredImageAlt: string
  publishedLabel: string | null
  publishedIso: string | null
}

const FILTERS = ['All', ...BLOG_CATEGORIES]

export default function BlogBrowser({ posts }: { posts: BlogCard[] }) {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const visible = posts.filter((post) => selectedCategory === 'All' || post.category === selectedCategory)

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        {FILTERS.map((category) => {
          const active = selectedCategory === category
          return (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className="rounded-full border-2 px-4 py-2 text-sm font-semibold"
              style={{
                backgroundColor: active ? '#EAB308' : '#FFFFFF',
                borderColor: active ? '#EAB308' : '#E5E7EB',
                color: active ? '#111827' : '#6B7280',
              }}
            >
              {category}
            </button>
          )
        })}
      </div>
      {posts.length === 0 ? (
        <p className="text-center text-lg text-gray-600">No blog posts yet. Check back soon!</p>
      ) : visible.length === 0 ? (
        <p className="text-center text-lg text-gray-600">No posts in {selectedCategory} yet.</p>
      ) : (
        <div className="grid gap-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {visible.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-sm">
              {post.featuredImage ? (
                <img src={post.featuredImage} alt={post.featuredImageAlt} className="h-48 w-full object-cover" />
              ) : null}
              <div className="flex flex-1 flex-col p-6">
                <span className="mb-2 inline-block w-fit rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-900">
                  {post.category}
                </span>
                <h2 className="text-xl font-bold text-gray-900">{post.title}</h2>
                {post.excerpt ? <p className="mt-2 flex-1 text-sm text-gray-600">{post.excerpt}</p> : null}
                {post.publishedLabel ? (
                  <time dateTime={post.publishedIso || undefined} className="mt-4 text-xs text-gray-500">
                    {post.publishedLabel}
                  </time>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
