import { v4 as uuidv4 } from 'uuid'

const SESSION_ID_KEY = 'builderbase_session_id'
const SESSION_EXPIRES_DAYS = 30
const PAGE_START_TIME_KEY = 'builderbase_page_start_time'

/**
 * Get or create a session ID for the current visitor
 * Session IDs expire after 30 days of inactivity
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return ''

  const stored = localStorage.getItem(SESSION_ID_KEY)
  const storedTime = localStorage.getItem(`${SESSION_ID_KEY}_time`)

  // Check if session exists and is not expired
  if (stored && storedTime) {
    const createdAt = parseInt(storedTime)
    const expiresAt = createdAt + SESSION_EXPIRES_DAYS * 24 * 60 * 60 * 1000
    if (Date.now() < expiresAt) {
      return stored
    }
  }

  // Create new session
  const newSessionId = uuidv4()
  localStorage.setItem(SESSION_ID_KEY, newSessionId)
  localStorage.setItem(`${SESSION_ID_KEY}_time`, Date.now().toString())

  return newSessionId
}

/**
 * Track time on current page (call when page starts)
 */
export function startPageTimer(): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(PAGE_START_TIME_KEY, Date.now().toString())
}

/**
 * Get duration spent on current page in seconds
 */
export function getPageDuration(): number {
  if (typeof window === 'undefined') return 0
  const startTime = sessionStorage.getItem(PAGE_START_TIME_KEY)
  if (!startTime) return 0
  const duration = (Date.now() - parseInt(startTime)) / 1000
  return Math.round(duration)
}

/**
 * Track an analytics event
 */
export async function trackEvent(eventData: {
  page?: string
  event?: string
  blogId?: string
  timeOnPage?: number
}) {
  try {
    const payload = {
      page: eventData.page || window.location.pathname,
      event: eventData.event,
      blogId: eventData.blogId,
      timeOnPage: eventData.timeOnPage || 0,
      device: /mobile|android|iphone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      referrer: document.referrer || 'direct',
      sessionId: getSessionId(),
    }
    
    console.log('📊 Analytics tracking:', payload)
    
    const res = await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    
    if (res.ok) {
      console.log('✅ Analytics tracked successfully')
      const data = await res.json()
      if (data.success) {
        // Even if Firestore failed, event was processed
        console.log('📈 Event processed (database persistence will be fixed separately)')
      }
    } else {
      console.error('❌ Analytics failed:', res.status, res.statusText)
    }
  } catch (error) {
    console.error('❌ Analytics error:', error)
  }
}
