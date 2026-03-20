'use client'

import { useState } from 'react'
import TrialModal from '../TrialModal'

export default function ForBuilders() {
  const [modalOpen, setModalOpen] = useState(false)

  const benefits = [
    {
      category: 'For Profitability',
      title: 'Know Your True Margins',
      description: 'Track every cost in real-time and know exactly how profitable each project actually is. No more guessing, no more underpricing.',
    },
    {
      category: 'For Profitability',
      title: 'Cut Admin Time in Half',
      description: 'Automate invoicing, quotes, and reporting. Spend more time building and less time on paperwork that doesn\'t make you money.',
    },
    {
      category: 'For Cash Flow',
      title: 'Get Paid Faster',
      description: 'Automated invoicing and payment reminders mean money hits your account faster. No more chasing payments while bills pile up.',
    },
    {
      category: 'For Peace of Mind',
      title: 'Everyone Knows What\'s Happening',
      description: 'No more daily check-ins or "where are we at?" calls. Your team sees schedules, tasks, and updates in real-time.',
    },
    {
      category: 'For Peace of Mind',
      title: 'Never Miss a Certificate Expiry',
      description: 'Sleep at night knowing every ticket, license, and certification is tracked. System alerts you before anything expires—so you stay compliant without thinking about it.',
    },
    {
      category: 'For Client Relationships',
      title: 'Fewer "Where Are You?" Calls',
      description: 'Clients see progress updates and photos in real-time through their portal. They stop worrying, you stop explaining.',
    },
  ]

  return (
    <section id="for-builders" className="bg-gray-50" style={{ paddingTop: '60px', paddingBottom: '60px' }}>
      <div className="container-custom">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 text-gray-900 px-4">Built for How NZ Builders Actually Work</h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed" style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center', paddingLeft: '16px', paddingRight: '16px' }}>
            Offline-capable, multi-site ready, and designed for tight margins. Not some imported system that doesn't get it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 mb-12 md:mb-16">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="text-xs font-bold mb-3 tracking-wide" style={{ color: '#EAB308' }}>
                {benefit.category}
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EAB308' }}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-base md:text-lg mb-2 text-gray-900">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm md:text-base leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="rounded-2xl p-8 md:p-12 text-center bg-gray-900" style={{ marginTop: '40px' }}>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 px-4">
            Ready to streamline your business?
          </h3>
          <p className="text-base md:text-lg text-gray-300 mb-6 md:mb-8" style={{ maxWidth: '48rem', margin: '0 auto 1.5rem auto', textAlign: 'center', paddingLeft: '16px', paddingRight: '16px' }}>
            See if it's the right fit for your build business—no credit card required
          </p>
          <button onClick={() => setModalOpen(true)} className="px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity text-base" style={{ backgroundColor: '#EAB308', color: '#111827' }}>
            Start Your Free 14-Day Trial
          </button>
        </div>
      </div>

      <TrialModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  )
}
