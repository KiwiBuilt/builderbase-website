'use client'

import { useEffect } from 'react'
import { trackEvent, startPageTimer } from '@/lib/analytics'

/**
 * PageTracker component - tracks page views and time on page
 * Place this in your root layout to track all page views
 */
export default function PageTracker() {
  useEffect(() => {
    // Start timing this page
    startPageTimer()
    
    // Track page view
    trackEvent({})

    // Track time on page when user leaves
    const handleUnload = () => {
      // Time will be calculated when user navigates away
    }

    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [])

  return null
}
