'use client'

import { useState } from 'react'
import Image from 'next/image'
import TrialModal from '../TrialModal'
import DemoModal from '../DemoModal'

export default function Hero() {
  const [modalOpen, setModalOpen] = useState(false)
  const [demoModalOpen, setDemoModalOpen] = useState(false)

  return (
    <section style={{ paddingTop: '75px', paddingBottom: '256px', background: 'white' }}>
      <div className="container-custom">
        <div className="animate-slide-up text-center">
          {/* Logo */}
          <div className="mb-12 flex justify-center">
            <Image
              src="/builderbase_logo.png"
              alt="BUILDER BASE"
              width={480}
              height={480}
              className="w-auto"
              style={{ height: '448px' }}
              priority
            />
          </div>
          
          <h1 className="text-7xl md:text-9xl font-black mb-8 text-gray-900 leading-none text-center">
            Construction Management
            <span className="block" style={{ color: '#EAB308' }}>Simplified</span>
          </h1>
          <p className="text-3xl text-gray-700 font-semibold leading-relaxed text-center" style={{ marginTop: '64px', marginBottom: '64px' }}>
            Builderbase: The digital backbone of your build.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <button onClick={() => setModalOpen(true)} className="btn-primary text-lg" style={{ fontSize: '1.125rem', padding: '1rem 2.5rem' }}>
              Start Free Trial
            </button>
            <button onClick={() => setDemoModalOpen(true)} className="btn-outline text-lg" style={{ fontSize: '1.125rem', padding: '1rem 2.5rem' }}>
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
