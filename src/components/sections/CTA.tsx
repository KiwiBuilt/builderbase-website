'use client'

import { useState } from 'react'
import TrialModal from '../TrialModal'
import DemoModal from '../DemoModal'

export default function CTA() {
  const [modalOpen, setModalOpen] = useState(false)
  const [demoModalOpen, setDemoModalOpen] = useState(false)

  return (
    <section className="py-16 md:py-32 bg-gray-900">
      <div className="container-custom">
        <div className="text-center" style={{ maxWidth: '64rem', margin: '0 auto', paddingLeft: '16px', paddingRight: '16px' }}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6" style={{ textAlign: 'center' }}>
            Ready to Transform Your Construction Business?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-8 md:mb-10" style={{ textAlign: 'center', margin: '0 auto 1.5rem auto' }}>
            See if BUILDER BASE is the right fit for your business. Start your free 14-day trial today.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6 md:mb-8" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <button onClick={() => setModalOpen(true)} className="px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity text-base" style={{ backgroundColor: '#EAB308', color: '#111827' }}>
              Start Your Free Trial
            </button>
            <button onClick={() => setDemoModalOpen(true)} className="text-white font-semibold border-2 border-white px-6 md:px-8 py-3 md:py-4 rounded-lg hover:bg-white hover:text-gray-900 transition-colors text-base">
              Schedule a Demo
            </button>
          </div>

          <p className="text-xs md:text-sm text-gray-400" style={{ textAlign: 'center' }}>
            No credit card required. Cancel anytime.
          </p>
        </div>
      </div>

      <TrialModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <DemoModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
    </section>
  )
}
