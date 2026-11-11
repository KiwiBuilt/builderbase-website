import type { Metadata } from 'next'
import './globals.css'
import { AuthSessionProvider } from '@/components/SessionProvider'
import PageTracker from '@/components/PageTracker'
import { PLANS, SITE_DESCRIPTION } from '@/lib/pricing'
import { resolveGaMeasurementId } from '@/lib/ga'

export const metadata: Metadata = {
  title: 'BUILDER BASE - Construction Management Software for NZ Builders',
  description: SITE_DESCRIPTION,
  keywords: 'construction management software, builder app NZ, job costing, invoicing software, project management builders, construction tracking, team scheduling, mobile time tracking, Xero integration, client portal software, construction estimating, building management platform, New Zealand builders',
  authors: [{ name: 'BUILDER BASE' }],
  creator: 'BUILDER BASE',
  publisher: 'BUILDER BASE',
  metadataBase: new URL('https://builderbase.co.nz'),
  alternates: {
    canonical: 'https://builderbase.co.nz',
  },
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_NZ',
    url: 'https://builderbase.co.nz',
    siteName: 'BUILDER BASE',
    title: 'BUILDER BASE - Construction Management Software for NZ Builders',
    description: SITE_DESCRIPTION,
    images: [
      {
        url: 'https://builderbase.co.nz/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'BUILDER BASE - Construction Management Software',
        type: 'image/svg+xml',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BUILDER BASE - Construction Management Software for NZ Builders',
    description: SITE_DESCRIPTION,
    images: ['https://builderbase.co.nz/og-image.svg'],
    creator: '@builderbasehq',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'verify-with-google-search-console',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const gaId = resolveGaMeasurementId(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID)
  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'BUILDER BASE',
    description: 'Construction management software for builders in New Zealand',
    applicationCategory: 'BusinessApplication',
    url: 'https://builderbase.co.nz',
    operatingSystem: 'Web, iOS, Android',
    offers: PLANS.map((plan) => ({
      '@type': 'Offer',
      name: plan.name,
      price: String(plan.priceMonthly),
      priceCurrency: 'NZD',
      availability: plan.available
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      description: plan.available
        ? `${plan.usersLabel}, ${plan.activeProjects.toLowerCase()} active projects. ${plan.price}/month. Available now.`
        : `Coming soon. Not yet available to purchase. ${plan.usersLabel}. ${plan.price}/month.`,
    })),
  }

  return (
    <html lang="en-NZ">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#EAB308" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="canonical" href="https://builderbase.co.nz" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="sitemap" type="application/xml" href="https://builderbase.co.nz/sitemap.xml" />
        
        {/* JSON-LD Schema Markup for better AI indexing */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'BUILDER BASE',
              url: 'https://builderbase.co.nz',
              description: 'All-in-one construction management software for NZ builders',
              logo: 'https://builderbase.co.nz/logo.png',
              sameAs: [
                'https://www.facebook.com/profile.php?id=61585309743900',
                'https://www.instagram.com/builderbasehq',
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                email: 'office@builderbase.co.nz',
                contactType: 'Sales',
                areaServed: 'NZ',
              },
            }),
          }}
        />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareSchema),
          }}
        />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'LocalBusiness',
              name: 'BUILDER BASE',
              description: 'Construction management software for New Zealand builders',
              url: 'https://builderbase.co.nz',
              areaServed: 'NZ',
              serviceType: 'Software Development, Construction Management',
            }),
          }}
        />

        {/* Google Analytics 4. Loaded only when a measurement ID is available. */}
        {gaId ? (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            ></script>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  window.gtag = gtag;
                  gtag('js', new Date());
                  gtag('config', '${gaId}', {
                    'page_path': window.location.pathname,
                    'page_title': document.title,
                  });
                `,
              }}
            />
          </>
        ) : null}

        {/* Ahrefs Analytics */}
        <script
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="ZZ+5iN0rEPiDTyiEyduY+g"
          async
        ></script>
      </head>
      <body className="bg-white text-gray-900">
        <PageTracker />
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  )
}
