import { v4 as uuidv4 } from 'uuid'

const SESSION_ID_KEY = 'builderbase_session_id'
const SESSION_EXPIRES_DAYS = 30

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
 * Track an analytics event
 */
export async function trackEvent(eventData: {
  page?: string
  event?: string
  blogId?: string
}) {
  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: eventData.page || window.location.pathname,
        event: eventData.event,
        blogId: eventData.blogId,
        device: /mobile|android|iphone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        referrer: document.referrer || 'direct',
        sessionId: getSessionId(),
      }),
    }).catch(() => {})
  } catch (error) {
    console.error('Error tracking event:', error)
  }
}
