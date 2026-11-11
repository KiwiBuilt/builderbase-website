import { PLANS, EXTRA_USER_ADDON_COPY, SITE_DESCRIPTION } from '@/lib/pricing'
import { listPublishedPosts } from '@/lib/blog-public'
import { SITE_URL } from '@/lib/site'

export const revalidate = 3600

export async function GET() {
  const posts = await listPublishedPosts()
  const lines = [
    '# BUILDER BASE',
    '',
    '> Construction management software built for New Zealand builders. The marketing site is https://www.builderbase.co.nz. The app is https://app.builderbase.co.nz.',
    '',
    SITE_DESCRIPTION,
    '',
    '## Product',
    '- Builderbase: The digital backbone of your build.',
    '- Made for New Zealand builders by KiwiBuilt.',
    '- Contact: office@builderbase.co.nz',
    `- ${EXTRA_USER_ADDON_COPY}.`,
    '- 14-day free trial. No credit card required.',
    '',
    '## Plans',
    ...PLANS.map((plan) => {
      const status = plan.available
        ? 'Available now.'
        : 'Coming soon. Not available to purchase yet.'
      return `- ${plan.name}: ${plan.price}/month (${plan.annualPrice} annually, ${plan.annualSavings}). ${plan.usersLabel}. ${plan.activeProjects} active projects. ${status} ${plan.description} Includes: ${plan.features.join(', ')}.`
    }),
    '',
    '## Pages',
    `- Home: ${SITE_URL}/`,
    `- Blog: ${SITE_URL}/blog`,
    `- Pricing: ${SITE_URL}/#pricing`,
    `- Features: ${SITE_URL}/#features`,
    `- Sign in: https://app.builderbase.co.nz`,
    `- Privacy: https://app.builderbase.co.nz/privacy`,
    `- Terms: https://app.builderbase.co.nz/terms`,
    '',
    '## Published articles',
    ...(posts.length
      ? posts.map((post) => {
          const summary = post.metaDescription || post.excerpt
          return `- [${post.title}](${SITE_URL}/blog/${post.slug})${summary ? `: ${summary}` : ''}`
        })
      : ['- No published articles yet.']),
    '',
  ]

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  })
}
