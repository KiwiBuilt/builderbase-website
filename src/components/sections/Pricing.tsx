'use client'

import { useState } from 'react'
import TrialModal from '../TrialModal'

export default function Pricing() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | undefined>(undefined)

  const plans = [
    {
      name: 'Essential Builder',
      badge: 'Founding Member',
      price: '$69',
      period: '/month',
      description: 'Solo builders (1-3 people) with unlimited projects',
      features: [
        '3 Team Members (Hard Cap)',
        'Unlimited projects & storage',
        'Mobile app (time clock, site diary, photos)',
        'Job costing & estimates',
        'Invoicing & quotes',
        'Basic scheduling (list view)',
        'Xero sync ($10/month addon)',
        'Email support',
      ],
      cta: 'Start Free Trial',
      highlighted: false,
    },
    {
      name: 'Basic Builder',
      badge: 'Founding Member',
      price: '$199',
      period: '/month',
      description: 'Small crews (1-5 people) who need mobile time tracking',
      features: [
        '5 Team Members',
        'Unlimited projects & storage',
        'Full mobile app (time clock, site diary, photos, tasks)',
        'Jobs, estimates, invoicing',
        'Client portal',
        'Xero integration',
      ],
      cta: 'Start Free Trial',
      highlighted: true,
    },
    {
      name: 'Professional',
      badge: 'Founding Member',
      price: '$399',
      period: '/month',
      description: 'Growing businesses (5-15 staff) needing team management',
      features: [
        '15 Team Members',
        'Unlimited projects & storage',
        'Everything in Basic +',
        'Staff management portal',
        'Leave management',
        'Purchase requests & approvals',
        'Certificate tracking (licenses, safety tickets)',
        'Issues tracking',
      ],
      cta: 'Start Free Trial',
      highlighted: false,
    },
  ]

  return (
    <section id="pricing" className="bg-gray-50" style={{ paddingTop: '60px', paddingBottom: '60px' }}>
      <div className="container-custom">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 px-4" style={{ marginBottom: '16px' }}>Simple, Transparent Pricing</h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed" style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center', paddingLeft: '16px', paddingRight: '16px', paddingBottom: '16px' }}>
            Choose the plan that fits your business. Add extra users anytime at $25/user/month
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
            Sign up now and lock in these prices for as long as you stay subscribed. Prices will increase as we build out features—if you cancel and rejoin later, new pricing applies.
          </p>
          <div style={{ fontSize: '12px', color: '#92400E', fontWeight: 600 }}>
            Get grandfathered-in pricing while it lasts
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`relative rounded-xl overflow-hidden transition-all ${
                plan.highlighted
                  ? 'md:scale-105 bg-white shadow-2xl border-2'
                  : 'bg-white border border-gray-200 shadow-lg'
              }`}
              style={plan.highlighted ? { borderColor: 'var(--color-builder-primary)' } : {}}
            >
              {plan.highlighted && (
                <div className="absolute top-0 right-0 text-gray-900 px-4 py-2 rounded-bl-lg font-semibold text-sm" style={{ backgroundColor: 'var(--color-builder-primary)' }}>
                  POPULAR
                </div>
              )}
              
              {plan.badge && (
                <div className="absolute bottom-0 right-0 text-white px-4 py-2 rounded-tl-lg font-semibold text-xs" style={{ backgroundColor: '#EAB308' }}>
                  💎 {plan.badge}
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold mb-2 text-gray-900">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-6">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>

                <button
                  onClick={() => {
                    setSelectedPlan(plan.name)
                    setModalOpen(true)
                  }}
                  className={plan.highlighted ? 'btn-primary w-full mb-8' : 'btn-secondary w-full mb-8'}
                >
                  {plan.cta}
                </button>

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

        {/* Feature Comparison Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden" style={{ marginTop: '40px', marginBottom: '40px' }}>
          <div style={{ padding: '24px 16px', borderBottom: '1px solid #E5E7EB' }}>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900">Feature Comparison</h3>
            <p className="text-gray-600 mt-2 text-sm md:text-base">See exactly what's included in each plan</p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                  <th style={{ padding: '24px 32px', textAlign: 'left', fontWeight: 600, color: '#111827', fontSize: '16px' }}>
                    Feature
                  </th>
                  <th style={{ padding: '24px 32px', textAlign: 'center', fontWeight: 600, color: '#111827', fontSize: '16px' }}>
                    Essential
                  </th>
                  <th style={{ padding: '24px 32px', textAlign: 'center', fontWeight: 600, color: '#111827', fontSize: '16px', backgroundColor: '#FEF3C7' }}>
                    Basic
                  </th>
                  <th style={{ padding: '24px 32px', textAlign: 'center', fontWeight: 600, color: '#111827', fontSize: '16px' }}>
                    Professional
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Team Members', essential: '3', basic: '5', professional: '15' },
                  { feature: 'Unlimited Projects & Storage', essential: '✓', basic: '✓', professional: '✓' },
                  { feature: 'Mobile App (Time Clock, Site Diary, Photos)', essential: '✓', basic: '✓', professional: '✓' },
                  { feature: 'Mobile Tasks', essential: '—', basic: '✓', professional: '✓' },
                  { feature: 'Job Costing & Estimates', essential: '✓', basic: '✓', professional: '✓' },
                  { feature: 'Invoicing & Quotes', essential: '✓', basic: '✓', professional: '✓' },
                  { feature: 'Scheduling', essential: 'Basic (List View)', basic: 'Full', professional: 'Full' },
                  { feature: 'Client Portal', essential: '—', basic: '✓', professional: '✓' },
                  { feature: 'Xero Integration', essential: '$10/month addon', basic: 'Included', professional: 'Included' },
                  { feature: 'Staff Management Portal', essential: '—', basic: '—', professional: '✓' },
                  { feature: 'Leave Management', essential: '—', basic: '—', professional: '✓' },
                  { feature: 'Purchase Requests & Approvals', essential: '—', basic: '—', professional: '✓' },
                  { feature: 'Certificate Tracking', essential: '—', basic: '—', professional: '✓' },
                  { feature: 'Issues Tracking', essential: '—', basic: '—', professional: '✓' },
                  { feature: 'Email Support', essential: '✓', basic: '✓', professional: '✓' },
                  { feature: 'Extra Users', essential: '$25/user/month', basic: '$25/user/month', professional: '$25/user/month' },
                ].map((row, idx) => (
                  <tr 
                    key={idx} 
                    style={{ 
                      borderBottom: '1px solid #E5E7EB',
                      backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'
                    }}
                  >
                    <td style={{ padding: '20px 32px', color: '#111827', fontSize: '15px', fontWeight: 500 }}>
                      {row.feature}
                    </td>
                    <td style={{ padding: '20px 32px', textAlign: 'center', color: '#6B7280', fontSize: '15px' }}>
                      {row.essential === '✓' ? (
                        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#EAB308' }}>✓</span>
                      ) : row.essential === '—' ? (
                        <span style={{ fontSize: '20px', color: '#D1D5DB' }}>—</span>
                      ) : (
                        row.essential
                      )}
                    </td>
                    <td style={{ padding: '20px 32px', textAlign: 'center', color: '#6B7280', fontSize: '15px', backgroundColor: 'rgba(254, 243, 199, 0.3)' }}>
                      {row.basic === '✓' ? (
                        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#EAB308' }}>✓</span>
                      ) : row.basic === '—' ? (
                        <span style={{ fontSize: '20px', color: '#D1D5DB' }}>—</span>
                      ) : (
                        row.basic
                      )}
                    </td>
                    <td style={{ padding: '20px 32px', textAlign: 'center', color: '#6B7280', fontSize: '15px' }}>
                      {row.professional === '✓' ? (
                        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#EAB308' }}>✓</span>
                      ) : row.professional === '—' ? (
                        <span style={{ fontSize: '20px', color: '#D1D5DB' }}>—</span>
                      ) : (
                        row.professional
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '32px', backgroundColor: '#F9FAFB', borderTop: '1px solid #E5E7EB', textAlign: 'center' }}>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>
              💡 All plans include a <strong>free trial with full feature access</strong>. No credit card required.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl p-10 border border-gray-200" style={{ marginTop: '80px' }}>
          <h3 className="text-3xl font-bold text-gray-900" style={{ marginBottom: '48px' }}>Frequently Asked Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                q: 'Does the mobile app work without internet?',
                a: 'Yes. Your crew can work offline on site, and everything syncs when they reconnect.',
              },
              {
                q: 'Do my clients automatically get portal access?',
                a: 'No setup needed. When you invite them, they get instant access—no extra steps or costs.',
              },
              {
                q: 'Can I integrate with Xero?',
                a: 'Yes, on Basic and Professional plans. Essential Builder doesn\'t include Xero sync.',
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
