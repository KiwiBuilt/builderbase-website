const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const

export function getLeadAttribution(): { source: string; utm: Record<string, string> | null } {
  if (typeof window === 'undefined') {
    return { source: '', utm: null }
  }

  const params = new URLSearchParams(window.location.search)
  const utm: Record<string, string> = {}
  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim()
    if (value) utm[key] = value
  }

  const source = utm.utm_source || document.referrer || 'direct'
  return { source, utm: Object.keys(utm).length ? utm : null }
}
