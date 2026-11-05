'use client'

import { useState, useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'
import { EXTRA_USER_ADDON_COPY, PLANS, PRICING_FAQ_ANSWER } from '@/lib/pricing'
import TrialModal from '../TrialModal'

export default function Pricing() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | undefined>(undefined)

  useEffect(() => {
    // Track pricing page view
    trackEvent({ event: 'pricing_viewed' })
  }, [])

  return (
    <section id="pricing" className="bg-gray-50" style={{ paddingTop: '60px', paddingBottom: '60px' }}>
      <div className="container-custom">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 px-4" style={{ marginBottom: '16px' }}>Simple, Transparent Pricing</h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed" style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center', paddingLeft: '16px', paddingRight: '16px', paddingBottom: '16px' }}>
            Choose the plan that fits your business. {EXTRA_USER_ADDON_COPY}
          </p>
        </div>

        {/* Founding Member Alert */}
        <div style={{
          backgroundColor: '#FEF3C7',
          border: '2px solid #EAB308',
          borderRadius: '16px',
          padding: '20px 16px',
          marginBottom: '32px',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '0 auto 32px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#92400E', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ⚡ Limited Time Offer
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
            Lock in Your Founding Member Rates
          </div>
          <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '12px', paddingLeft: '12px', paddingRight: '12px' }}>
            Essential is available to start today. Basic and Professional are coming soon and cannot be purchased yet. When you subscribe, you lock in that plan&apos;s price for as long as you stay subscribed.
          </p>
          <div style={{ fontSize: '12px', color: '#92400E', fontWeight: 600 }}>
            Get grandfathered-in pricing while it lasts
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl overflow-hidden transition-all bg-white border shadow-lg ${
                plan.available ? 'border-gray-200' : 'border-2'
              }`}
              style={plan.available ? undefined : { borderColor: 'var(--color-builder-primary)' }}
            >
              {plan.badge && (
                <div 
                  className="absolute top-0 right-0 font-semibold rounded-bl-lg px-4 py-3 text-sm"
                  style={plan.available ? {
                    backgroundColor: '#EAB308',
                    color: 'white',
                    fontSize: '12px',
                  } : {
                    backgroundColor: '#FF6B35',
                    color: 'white',
                  }}
                >
                  {plan.available ? `💎 ${plan.badge}` : '🚀 COMING SOON'}
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold mb-2 text-gray-900" style={{ paddingRight: plan.badge ? '110px' : '0' }}>{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-6" style={{ paddingRight: plan.badge ? '110px' : '0' }}>{plan.description}</p>

                {!plan.available && (
                  <div style={{
                    backgroundColor: '#FEE2E2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '16px',
                    textAlign: 'center',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#DC2626'
                  }}>
                    Coming soon — not available to purchase yet
                  </div>
                )}

                <div className="mb-6" style={plan.available ? undefined : { opacity: 0.7 }}>
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                  {plan.annualPrice && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#059669', fontWeight: 600 }}>
                      {plan.annualSavings}
                    </div>
                  )}
                  {plan.annualPrice && (
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>
                      {plan.annualPrice}/year billed annually
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!plan.available) return
                    setSelectedPlan(plan.name)
                    setModalOpen(true)
                  }}
                  disabled={!plan.available}
                  className={plan.available ? 'btn-primary w-full mb-8' : 'btn-secondary w-full mb-8'}
                  style={plan.available ? undefined : { opacity: 0.6, cursor: 'not-allowed' }}
                >
                  {plan.available ? 'Start Free Trial' : 'Coming Soon'}
                </button>

                <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Limits
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                    <div>
                      <div style={{ color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Users</div>
                      <div style={{ color: '#111827', fontWeight: 600, fontSize: '14px' }}>{plan.users}</div>
                    </div>
                    <div>
                      <div style={{ color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Active Projects</div>
                      <div style={{ color: '#111827', fontWeight: 600, fontSize: '14px' }}>{plan.activeProjects}</div>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Features Included
                  </div>
                </div>

                <div className="space-y-4">
                  {plan.features.map((feature, fidx) => (
                    <div key={fidx} className="flex items-start gap-3">
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'var(--color-builder-primary)' }}>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>


        {/* FAQ */}
        <div className="bg-white rounded-2xl p-10 border border-gray-200" style={{ marginTop: '80px' }}>
          <h3 className="text-3xl font-bold text-gray-900" style={{ marginBottom: '48px' }}>Frequently Asked Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                q: 'What are the monthly prices?',
                a: PRICING_FAQ_ANSWER,
              },
              {
                q: 'Does the mobile app work without internet?',
                a: 'Yes. Your crew can work offline on site, and everything syncs when they reconnect.',
              },
              {
                q: 'Do my clients automatically get portal access?',
                a: 'It\'s optional and up to you. When you choose to invite them, they get instant access—no extra steps or costs.',
              },
              {
                q: 'Can I integrate with Xero?',
                a: 'Yes, on Basic and Professional plans. Essential doesn\'t include Xero sync.',
              },
              {
                q: 'Does the free trial include all features?',
                a: 'Yes, everything. No credit card required, and you get full access to all features.',
              },
              {
                q: 'What happens to my data if I cancel?',
                a: 'Your data remains accessible for 30 days. You can export everything before your subscription ends.',
              },
            ].map((item, idx) => (
              <div key={idx}>
                <h4 className="font-semibold text-gray-900 mb-2">{item.q}</h4>
                <p className="text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <TrialModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        preSelectedPlan={selectedPlan}
      />
    </section>
  )
}
