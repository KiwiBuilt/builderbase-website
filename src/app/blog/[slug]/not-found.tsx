import type { Metadata } from 'next'
import Link from 'next/link'
import SiteFrame from '@/components/blog/SiteFrame'
import { SITE_NAME } from '@/lib/site'

export const metadata: Metadata = {
  title: `Post not found | ${SITE_NAME}`,
  robots: { index: false, follow: false },
}

export default function BlogPostNotFound() {
  return (
    <SiteFrame>
      <div className="container-custom py-24 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Blog post not found</h1>
        <p className="mt-3 text-gray-600">That article is not published.</p>
        <Link href="/blog" className="mt-6 inline-block font-semibold text-yellow-700">
          Back to all posts
        </Link>
      </div>
    </SiteFrame>
  )
}
