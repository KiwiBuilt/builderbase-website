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
    <section id="pricing" className="bg-gray-50" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">Simple, Transparent Pricing</h2>
          <p className="text-xl text-gray-600 leading-relaxed" style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center', paddingBottom: '32px' }}>
            Choose the plan that fits your business. Add extra users anytime at $30/user/month
          </p>
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
