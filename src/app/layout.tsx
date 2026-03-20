import type { Metadata } from 'next'
import './globals.css'
import { AuthSessionProvider } from '@/components/SessionProvider'

export const metadata: Metadata = {
  title: 'BUILDER BASE - Construction Management Software for NZ Builders',
  description: 'All-in-one construction management platform for NZ builders. Job costing, invoicing, project tracking, mobile app, team scheduling, client portals, and Xero integration. Start free trial - no credit card required.',
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
    description: 'All-in-one construction management platform. Job costing, invoicing, scheduling, mobile app, team management. Start your free trial today.',
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
    description: 'All-in-one construction management platform for builders. Job costing, invoicing, mobile app, and more.',
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
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'BUILDER BASE',
              description: 'Construction management software for builders in New Zealand',
              applicationCategory: 'BusinessApplication',
              url: 'https://builderbase.co.nz',
              operatingSystem: 'Web, iOS, Android',
              offers: [
                {
                  '@type': 'Offer',
                  name: 'Essential Builder',
                  price: '69',
                  priceCurrency: 'NZD',
                  description: 'Solo builders (1-3 people) with unlimited projects',
                },
                {
                  '@type': 'Offer',
                  name: 'Basic Builder',
                  price: '199',
                  priceCurrency: 'NZD',
                  description: 'Small crews (1-5 people) who need mobile time tracking',
                },
                {
                  '@type': 'Offer',
                  name: 'Professional',
                  price: '399',
                  priceCurrency: 'NZD',
                  description: 'Growing businesses (5-15 staff) needing team management',
                },
              ],
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                ratingCount: '47',
              },
            }),
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

        {/* Google Analytics 4 */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-XXXXXXXXXX', {
                'page_path': window.location.pathname,
                'page_title': document.title,
              });
            `,
          }}
        />
      </head>
      <body className="bg-white text-gray-900">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  )
}
