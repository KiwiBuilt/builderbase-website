import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function SiteFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header />
      <main className="pt-20 md:pt-24">{children}</main>
      <Footer />
    </div>
  )
}
