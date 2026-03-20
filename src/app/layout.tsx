import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BUILDER BASE - Construction Management Software for NZ Builders',
  description: 'Complete construction and building management platform. Job costing, invoicing, project management, team coordination, and client portals. Try BUILDER BASE free today.',
  keywords: 'construction management, builder software, job costing, invoicing, project management, NZ builders, construction tracking',
  authors: [{ name: 'BUILDER BASE' }],
  creator: 'BUILDER BASE',
  publisher: 'BUILDER BASE',
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
    description: 'Complete construction and building management platform for builders and construction companies in New Zealand.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BUILDER BASE',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BUILDER BASE - Construction Management Software',
    description: 'Complete construction and building management platform for NZ builders.',
    images: ['/og-image.png'],
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
              gtag('config', 'G-XXXXXXXXXX');
            `,
          }}
        />
      </head>
      <body className="bg-white text-gray-900">
        {children}
      </body>
    </html>
  )
}
