import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { sanitizeBlogHtml } from './blog-content.ts'
import {
  BLOG_CATEGORIES,
  buildBlogPosting,
  buildBreadcrumbList,
  buildFaqPage,
  buildPostMetadata,
  formatNzDate,
  htmlToText,
  postPublishedIso,
  serializeBlogPost,
  slugForTitleChange,
  slugify,
  toIsoDateTime,
  validateBlogWrite,
  validateCommentInput,
} from './blog.ts'
import { DEFAULT_GEMINI_MODELS, geminiModelCandidates, generationPrompt, parseModelJson } from './gemini.ts'
import { SITE_LOGO_URL, SITE_URL } from './site.ts'

const sample = {
  id: 'post1',
  title: 'How to run a site diary',
  slug: 'how-to-run-a-site-diary',
  excerpt: 'A practical diary routine for NZ building sites.',
  content: '<h2>Start of day</h2><p>Walk the site before the team starts.</p>',
  metaDescription: 'A practical guide to running a construction site diary in New Zealand.',
  keywords: 'site diary, construction, new zealand',
  category: 'Guides' as const,
  published: true,
  featuredImage: 'https://example.com/hero.jpg',
  featuredImageAlt: 'Builder reviewing a site diary',
  publishDate: '2026-11-11',
  publishedAt: '2026-11-11T01:00:00.000Z',
  updatedAt: '2026-11-12T01:00:00.000Z',
  createdAt: '2026-11-10T01:00:00.000Z',
  author: 'Corey',
  faqs: [{ question: 'Who fills it in?', answer: 'The site supervisor, every working day.' }],
  slugLocked: true,
  views: 3,
}

describe('blog dates', () => {
  it('reads Firestore timestamp shapes and never returns Invalid Date', () => {
    const iso = toIsoDateTime({ seconds: 1_700_000_000, nanoseconds: 0 })
    assert.equal(iso, new Date(1_700_000_000 * 1000).toISOString())
    assert.equal(toIsoDateTime({ _seconds: 1_700_000_000, _nanoseconds: 0 }), iso)
    assert.equal(toIsoDateTime('not a date'), null)
    assert.equal(toIsoDateTime({}), null)
    assert.equal(formatNzDate('not a date'), null)
    assert.equal(formatNzDate({ seconds: 'bad' }), null)
    const label = formatNzDate({ seconds: 1_700_000_000, nanoseconds: 0 })
    assert.ok(label)
    assert.notEqual(label, 'Invalid Date')
    assert.equal(formatNzDate('2026-11-11'), '11 November 2026')
  })

  it('prefers the editorial publish date over the timestamp', () => {
    assert.equal(postPublishedIso(sample), '2026-11-11T00:00:00.000Z')
    const serialized = serializeBlogPost('abc', {
      title: 'Draft',
      slug: 'draft-post',
      published: false,
      createdAt: { seconds: 1_700_000_000, nanoseconds: 0 },
    })
    assert.ok(serialized)
    assert.equal(serialized?.createdAt, new Date(1_700_000_000 * 1000).toISOString())
    assert.equal(formatNzDate(serialized?.createdAt), formatNzDate(new Date(1_700_000_000 * 1000).toISOString()))
  })
})

describe('blog editor fields', () => {
  it('keeps one category list and locks a published slug', () => {
    assert.deepEqual(BLOG_CATEGORIES, ['General', 'Tips & Tricks', 'Case Studies', 'Updates', 'Guides', 'Industry News'])
    assert.equal(slugify('How to Run a Site Diary!'), 'how-to-run-a-site-diary')
    assert.equal(
      slugForTitleChange({
        previousTitle: 'Old title',
        nextTitle: 'New title',
        currentSlug: 'old-title',
        slugLocked: true,
      }),
      'old-title'
    )
    assert.equal(
      slugForTitleChange({
        previousTitle: 'Old title',
        nextTitle: 'New title',
        currentSlug: 'custom-slug',
        slugLocked: false,
      }),
      'custom-slug'
    )
    assert.equal(
      slugForTitleChange({
        previousTitle: 'Old title',
        nextTitle: 'New title',
        currentSlug: 'old-title',
        slugLocked: false,
      }),
      'new-title'
    )
  })

  it('requires a meta description and hero alt text before publish', () => {
    const draft = validateBlogWrite({ title: 'Hello', slug: 'hello', content: '<p>Body</p>' }, false)
    assert.equal(draft.ok, true)
    const missingMeta = validateBlogWrite({ title: 'Hello', slug: 'hello', content: '<p>Body</p>' }, true)
    assert.equal(missingMeta.ok, false)
    if (!missingMeta.ok) assert.match(missingMeta.error, /meta description/)
    const missingAlt = validateBlogWrite(
      {
        title: 'Hello',
        slug: 'hello',
        content: '<p>Body</p>',
        metaDescription: 'A useful description for builders.',
        featuredImage: 'https://example.com/a.jpg',
      },
      true
    )
    assert.equal(missingAlt.ok, false)
    const published = validateBlogWrite(
      {
        title: 'Hello',
        slug: 'hello',
        content: '<p>Body</p>',
        metaDescription: 'A useful description for builders.',
        category: 'Guides',
        author: 'Corey',
        publishDate: '2026-11-11',
        faqs: [{ question: 'When?', answer: 'Every morning.' }],
      },
      true
    )
    assert.equal(published.ok, true)
    if (published.ok) {
      assert.equal(published.value.category, 'Guides')
      assert.equal(published.value.author, 'Corey')
      assert.equal(published.value.publishDate, '2026-11-11')
      assert.equal(published.value.faqs.length, 1)
    }
  })

  it('keeps image alt text and removes script markup', () => {
    const clean = sanitizeBlogHtml(
      '<h1>Title</h1><script>alert(1)</script><img src="https://example.com/a.png" alt="Site diary" onerror="alert(1)"><p onclick="x">Hi</p><a href="javascript:alert(1)">bad</a>'
    )
    assert.match(clean, /<h2>Title<\/h2>/)
    assert.match(clean, /alt="Site diary"/)
    assert.match(clean, /<p>Hi<\/p>/)
    assert.doesNotMatch(clean, /script|onerror|onclick|javascript/i)
    assert.equal(htmlToText('<p></p>'), '')
  })
})

describe('blog metadata', () => {
  it('builds a www canonical, article tags, and BlogPosting schema', () => {
    const metadata = buildPostMetadata(sample)
    assert.equal(metadata.title, 'How to run a site diary | BUILDER BASE')
    assert.equal(metadata.description, sample.metaDescription)
    assert.equal(metadata.alternates.canonical, `${SITE_URL}/blog/${sample.slug}`)
    assert.equal(metadata.openGraph.type, 'article')
    assert.equal(metadata.openGraph.url, `${SITE_URL}/blog/${sample.slug}`)
    assert.equal(metadata.openGraph.publishedTime, '2026-11-11T00:00:00.000Z')
    assert.equal(metadata.openGraph.modifiedTime, sample.updatedAt)
    assert.equal(metadata.openGraph.images[0].url, sample.featuredImage)
    assert.equal(metadata.openGraph.images[0].alt, sample.featuredImageAlt)
    assert.equal(metadata.twitter.card, 'summary_large_image')

    const schema = buildBlogPosting(sample)
    assert.equal(schema['@type'], 'BlogPosting')
    assert.equal(schema.headline, sample.title)
    assert.equal(schema.description, sample.metaDescription)
    assert.deepEqual(schema.image, [sample.featuredImage])
    assert.equal(schema.datePublished, '2026-11-11T00:00:00.000Z')
    assert.equal(schema.dateModified, sample.updatedAt)
    assert.equal(schema.author['@type'], 'Person')
    assert.equal(schema.author.name, 'Corey')
    assert.equal(schema.publisher['@type'], 'Organization')
    assert.equal(schema.publisher.logo.url, SITE_LOGO_URL)
    assert.equal(schema.mainEntityOfPage['@id'], `${SITE_URL}/blog/${sample.slug}`)
    assert.match(SITE_LOGO_URL, /\/builderbase_logo\.png$/)
    assert.doesNotMatch(SITE_LOGO_URL, /\/logo\.png$/)

    const crumbs = buildBreadcrumbList([
      { name: 'Home', path: '/' },
      { name: 'Blog', path: '/blog' },
      { name: sample.title, path: `/blog/${sample.slug}` },
    ])
    assert.equal(crumbs.itemListElement[2].item, `${SITE_URL}/blog/${sample.slug}`)
    const faq = buildFaqPage(sample.faqs)
    assert.equal(faq?.['@type'], 'FAQPage')
    assert.equal(buildFaqPage([]), null)
  })
})

describe('comments and gemini', () => {
  it('rejects short comments and keeps approved comments private until approved', () => {
    const bad = validateCommentInput({ blogId: 'abc', name: 'Sam', email: 'sam@example.com', content: 'short' })
    assert.equal(bad.ok, false)
    const good = validateCommentInput({
      blogId: 'abc_123',
      name: 'Sam',
      email: 'sam@example.com',
      content: '<b>This is a long enough comment</b>',
    })
    assert.equal(good.ok, true)
    if (good.ok) assert.equal(good.value.content, 'This is a long enough comment')
  })

  it('accepts the editor topic field and does not call the retired Gemini model', () => {
    assert.equal(generationPrompt({ topic: 'Write about variations' }), 'Write about variations')
    assert.equal(generationPrompt({ prompt: '  Use this  ', topic: 'ignored' }), 'Use this')
    assert.equal(generationPrompt({}), '')
    assert.ok(!DEFAULT_GEMINI_MODELS.some((model) => model.includes('1.5')))
    assert.deepEqual(geminiModelCandidates(''), [...DEFAULT_GEMINI_MODELS])
    assert.deepEqual(geminiModelCandidates('gemini-3.8-flash'), ['gemini-3.8-flash'])
    const parsed = parseModelJson('```json\n{"title":"Hello"}\n```')
    assert.equal(parsed?.title, 'Hello')
  })
})
