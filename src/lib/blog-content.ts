import sanitizeHtml from 'sanitize-html'

const ALLOWED_TAGS = [
  'h2',
  'h3',
  'h4',
  'p',
  'br',
  'ul',
  'ol',
  'li',
  'a',
  'strong',
  'em',
  'b',
  'i',
  'u',
  'blockquote',
  'code',
  'pre',
  'img',
  'figure',
  'figcaption',
  'hr',
]

export function sanitizeBlogHtml(html: string): string {
  return sanitizeHtml(html || '', {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href', 'title', 'rel', 'target'],
      img: ['src', 'alt', 'title', 'width', 'height'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      img: ['https'],
    },
    allowProtocolRelative: false,
    transformTags: {
      h1: 'h2',
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          rel: 'noopener noreferrer',
        },
      }),
    },
  }).trim()
}
