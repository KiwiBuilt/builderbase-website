'use client'

import { useState } from 'react'
import Image from 'next/image'
import TrialModal from '../TrialModal'
import DemoModal from '../DemoModal'

export default function Hero() {
  const [modalOpen, setModalOpen] = useState(false)
  const [demoModalOpen, setDemoModalOpen] = useState(false)

  return (
    <section style={{ paddingTop: '60px', paddingBottom: '80px', paddingLeft: '16px', paddingRight: '16px', background: 'white' }}>
      <div className="container-custom">
        <div className="animate-slide-up text-center">
          {/* Logo */}
          <div className="mb-8 md:mb-12 flex justify-center">
            <Image
              src="/builderbase_logo.png"
              alt="BUILDER BASE"
              width={480}
              height={480}
              className="w-auto"
              style={{ height: 'auto', maxHeight: '280px', width: 'auto' }}
              priority
            />
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-9xl font-black mb-6 md:mb-8 text-gray-900 leading-tight md:leading-none text-center">
            Construction Management
            <span className="block" style={{ color: '#EAB308' }}>Simplified</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-3xl text-gray-700 font-semibold leading-relaxed text-center" style={{ marginTop: '32px', marginBottom: '40px', paddingLeft: '16px', paddingRight: '16px' }}>
            Builderbase: The digital backbone of your build.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center mb-12 md:mb-16 px-4 sm:px-0">
            <button onClick={() => setModalOpen(true)} className="btn-primary text-base md:text-lg" style={{ fontSize: 'inherit', padding: '0.875rem 2rem' }}>
              Start Free Trial
            </button>
            <button onClick={() => setDemoModalOpen(true)} className="btn-outline text-base md:text-lg" style={{ fontSize: 'inherit', padding: '0.875rem 2rem' }}>
              Schedule a Demo
            </button>
          </div>

          {/* Trust Badge */}
          <div className="flex items-center justify-center gap-3 text-gray-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'var(--color-builder-primary)' }}>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-base">14-day free trial, no credit card required</span>
          </div>
        </div>
      </div>

      <TrialModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <DemoModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
    </section>
  )
}
