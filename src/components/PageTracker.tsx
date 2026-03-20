'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'

/**
 * PageTracker component - tracks page views automatically
 * Place this in your root layout to track all page views
 */
export default function PageTracker() {
  useEffect(() => {
    // Track page view
    trackEvent({})
  }, [])

  return null
}
