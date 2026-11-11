import Header from '@/components/Header'
import Hero from '@/components/sections/Hero'
import Features from '@/components/sections/Features'
import ForBuilders from '@/components/sections/ForBuilders'
import ForClients from '@/components/sections/ForClients'
import Pricing from '@/components/sections/Pricing'
import CTA from '@/components/sections/CTA'
import Footer from '@/components/Footer'
import { Metadata } from 'next'
import { SITE_DESCRIPTION } from '@/lib/pricing'

export const metadata: Metadata = {
  title: 'BUILDER BASE - Construction Management Software for NZ Builders',
  description: SITE_DESCRIPTION,
  alternates: { canonical: 'https://www.builderbase.co.nz' },
  openGraph: {
    url: 'https://www.builderbase.co.nz',
    title: 'BUILDER BASE - Construction Management Software for NZ Builders',
    description: SITE_DESCRIPTION,
  },
}

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Features />
      <ForBuilders />
      <ForClients />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  )
}
