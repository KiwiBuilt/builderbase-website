export const SITE_URL = 'https://www.builderbase.co.nz'
export const SITE_NAME = 'BUILDER BASE'
export const SITE_LOGO_PATH = '/builderbase_logo.png'
export const SITE_LOGO_URL = `${SITE_URL}${SITE_LOGO_PATH}`
export const SITE_OG_IMAGE_PATH = '/og-image.png'
export const SITE_OG_IMAGE_URL = `${SITE_URL}${SITE_OG_IMAGE_PATH}`
export const DEFAULT_AUTHOR = 'Builder Base'

export function absoluteUrl(path: string): string {
  if (!path) return SITE_URL
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
