export const GA_MEASUREMENT_ID_FALLBACK = 'G-EJ58C7NBCJ'

const GA_ID_PATTERN = /^G-[A-Z0-9]+$/i

export function resolveGaMeasurementId(configured?: string | null): string {
  const trimmed = configured?.trim() ?? ''
  if (GA_ID_PATTERN.test(trimmed)) return trimmed
  return GA_MEASUREMENT_ID_FALLBACK
}

type Gtag = (...args: unknown[]) => void

declare global {
  interface Window {
    gtag?: Gtag
  }
}

export function trackGaEvent(
  eventName: 'trial_request' | 'demo_request',
  params?: Record<string, string>
) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', eventName, params)
}
