'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackEvent, startPageTimer } from '@/lib/analytics'

/**
 * PageTracker component - tracks page views and time on page
 * Excludes admin routes from analytics tracking
 * Place this in your root layout to track all public page views
 */
export default function PageTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // Don't track admin panel routes
    if (pathname.startsWith('/admin/')) {
      return
    }

    // Start timing this page
    startPageTimer()
    
    // Track page view for public pages only
    trackEvent({})

    // Track time on page when user leaves
    const handleUnload = () => {
      // Time will be calculated when user navigates away
    }

    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [pathname])

  return null
}
