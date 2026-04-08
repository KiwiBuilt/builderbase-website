'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import TrialModal from './TrialModal'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/builderbase_logo.png"
              alt="BUILDER BASE - Construction Management Software"
              width={100}
              height={100}
              className="h-14 md:h-20 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </Link>
            <Link href="#for-builders" className="text-gray-600 hover:text-gray-900 transition-colors">
              For Builders
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </Link>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <a href="https://app.builderbase.co.nz" className="btn-secondary text-sm">
              Sign In
            </a>
            <button onClick={() => setModalOpen(true)} className="btn-primary text-sm">
              Start Free Trial
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 flex flex-col gap-4">
            <Link href="#features" className="text-gray-600 hover:text-gray-900">Features</Link>
            <Link href="#for-builders" className="text-gray-600 hover:text-gray-900">For Builders</Link>
            <Link href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link>
            <button onClick={() => setModalOpen(true)} className="btn-primary w-full text-sm">Start Free Trial</button>
          </nav>
        )}
      </div>

      <TrialModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </header>
  )
}
