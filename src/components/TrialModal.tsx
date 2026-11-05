'use client'

import { useState, useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'
import { getLeadAttribution } from '@/lib/attribution'
import { trackGaEvent } from '@/lib/ga'
import { PLANS, trialPlan } from '@/lib/pricing'

interface TrialModalProps {
  isOpen: boolean
  onClose: () => void
  preSelectedPlan?: string
}

export default function TrialModal({ isOpen, onClose, preSelectedPlan }: TrialModalProps) {
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const requestedPlan = PLANS.find((plan) => plan.available && plan.name === preSelectedPlan)
  const activePlan = requestedPlan ?? trialPlan()

  useEffect(() => {
    if (!isOpen) {
      setSubmitted(false)
      setSubmitError(null)
      setSubmitting(false)
      return
    }
    trackEvent({ event: 'form_started', page: '/trial' })
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (submitting) return

    const form = e.currentTarget
    const formData = new FormData(form)
    const data: Record<string, unknown> = Object.fromEntries(formData)
    const attribution = getLeadAttribution()
    data.plan = activePlan.name
    data.source = attribution.source
    if (attribution.utm) data.utm = attribution.utm

    setSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch('/api/trial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        setSubmitError('We could not send your trial request. Please try again, or email office@builderbase.co.nz.')
        return
      }

      trackGaEvent('trial_request', { plan: activePlan.name })
      await trackEvent({ event: 'form_completed' })
      setSubmitted(true)
    } catch (error) {
      console.error('Error submitting trial form:', error)
      setSubmitError('We could not send your trial request. Please try again, or email office@builderbase.co.nz.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-12 max-w-md w-full text-center shadow-2xl">
          <div className="mb-8">
            <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: '#FEF3C7' }}>
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#EAB308' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-3xl font-bold mb-4 text-gray-900">Thank You!</h3>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            We&apos;ll contact you within 24 hours to set up your free trial and get you started.
          </p>
          <button
            onClick={() => {
              setSubmitted(false)
              onClose()
            }}
            className="w-full py-4 rounded-xl font-semibold text-base transition-all hover:opacity-90"
            style={{ backgroundColor: '#EAB308', color: '#111827' }}
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)'
      }}
    >
      <div 
        className="bg-white w-full max-h-[90vh] overflow-y-auto"
        style={{
          maxWidth: '600px',
          borderRadius: '24px',
          padding: '48px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="font-bold text-gray-900 mb-2" style={{ fontSize: '32px' }}>Start Your Free Trial</h3>
            <p className="text-gray-600" style={{ fontSize: '16px' }}>Get started in less than a minute</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            style={{ padding: '8px', borderRadius: '8px' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
          <div>
            <label className="block font-semibold text-gray-800 mb-3" style={{ fontSize: '14px' }}>
              Your trial plan
            </label>
            <input type="hidden" name="plan" value={activePlan.name} />
            <div
              style={{
                padding: '14px 16px',
                border: '2px solid #EAB308',
                borderRadius: '12px',
                backgroundColor: '#FEF3C7',
              }}
            >
              <div style={{ fontWeight: 600, color: '#111827', fontSize: '16px' }}>{activePlan.name}</div>
              <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '2px' }}>
                {activePlan.price}/month • {activePlan.usersLabel} • available now
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              {PLANS.filter((plan) => !plan.available).map((plan) => (
                <div
                  key={plan.name}
                  style={{
                    padding: '12px 16px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    backgroundColor: '#F9FAFB',
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#6B7280', fontSize: '16px' }}>
                    {plan.name} · Coming soon
                  </div>
                  <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '2px' }}>
                    {plan.price}/month • {plan.usersLabel} • not available to purchase yet
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block font-semibold text-gray-800 mb-2" style={{ fontSize: '14px' }}>
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full bg-white text-gray-900 outline-none transition-all"
              style={{
                padding: '14px 16px',
                border: '2px solid #E5E7EB',
                borderRadius: '12px',
                fontSize: '16px'
              }}
              placeholder="John Smith"
              onFocus={(e) => {
                e.target.style.borderColor = '#EAB308'
                e.target.style.boxShadow = '0 0 0 3px rgba(234, 179, 8, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E5E7EB'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Company Name */}
          <div>
            <label htmlFor="company" className="block font-semibold text-gray-800 mb-2" style={{ fontSize: '14px' }}>
              Company Name *
            </label>
            <input
              type="text"
              id="company"
              name="company"
              required
              className="w-full bg-white text-gray-900 outline-none transition-all"
              style={{
                padding: '14px 16px',
                border: '2px solid #E5E7EB',
                borderRadius: '12px',
                fontSize: '16px'
              }}
              placeholder="ABC Construction Ltd"
              onFocus={(e) => {
                e.target.style.borderColor = '#EAB308'
                e.target.style.boxShadow = '0 0 0 3px rgba(234, 179, 8, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E5E7EB'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block font-semibold text-gray-800 mb-2" style={{ fontSize: '14px' }}>
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full bg-white text-gray-900 outline-none transition-all"
              style={{
                padding: '14px 16px',
                border: '2px solid #E5E7EB',
                borderRadius: '12px',
                fontSize: '16px'
              }}
              placeholder="john@abcconstruction.co.nz"
              onFocus={(e) => {
                e.target.style.borderColor = '#EAB308'
                e.target.style.boxShadow = '0 0 0 3px rgba(234, 179, 8, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E5E7EB'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block font-semibold text-gray-800 mb-2" style={{ fontSize: '14px' }}>
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              className="w-full bg-white text-gray-900 outline-none transition-all"
              style={{
                padding: '14px 16px',
                border: '2px solid #E5E7EB',
                borderRadius: '12px',
                fontSize: '16px'
              }}
              placeholder="021 123 4567"
              onFocus={(e) => {
                e.target.style.borderColor = '#EAB308'
                e.target.style.boxShadow = '0 0 0 3px rgba(234, 179, 8, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E5E7EB'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Team Size */}
          <div>
            <label htmlFor="team_size" className="block font-semibold text-gray-800 mb-2" style={{ fontSize: '14px' }}>
              How many team members? *
            </label>
            <select
              id="team_size"
              name="team_size"
              required
              className="w-full bg-white text-gray-900 outline-none transition-all"
              style={{
                padding: '14px 16px',
                border: '2px solid #E5E7EB',
                borderRadius: '12px',
                fontSize: '16px'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#EAB308'
                e.target.style.boxShadow = '0 0 0 3px rgba(234, 179, 8, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E5E7EB'
                e.target.style.boxShadow = 'none'
              }}
            >
              <option value="">Select team size</option>
              <option value="1-3">1-3 people</option>
              <option value="4-10">4-10 people</option>
              <option value="11-20">11-20 people</option>
              <option value="20+">20+ people</option>
            </select>
          </div>

          {/* Message (Optional) */}
          <div>
            <label htmlFor="message" className="block font-semibold text-gray-800 mb-2" style={{ fontSize: '14px' }}>
              Message (Optional)
            </label>
            <textarea
              id="message"
              name="message"
              rows={3}
              className="w-full bg-white text-gray-900 outline-none transition-all resize-none"
              style={{
                padding: '14px 16px',
                border: '2px solid #E5E7EB',
                borderRadius: '12px',
                fontSize: '16px'
              }}
              placeholder="Tell us about your business..."
              onFocus={(e) => {
                e.target.style.borderColor = '#EAB308'
                e.target.style.boxShadow = '0 0 0 3px rgba(234, 179, 8, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E5E7EB'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          {submitError && (
            <p role="alert" style={{ color: '#B91C1C', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '12px 14px', fontSize: '14px', margin: 0 }}>
              {submitError}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full font-semibold transition-all hover:opacity-90"
            style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: '#EAB308',
              color: '#111827',
              fontSize: '16px',
              marginTop: '8px',
              opacity: submitting ? 0.7 : 1,
              cursor: submitting ? 'wait' : 'pointer',
            }}
          >
            {submitting ? 'Sending...' : 'Request Free Trial'}
          </button>

          <p className="text-gray-500 text-center" style={{ fontSize: '14px', marginTop: '8px' }}>
            No credit card required • 14-day trial with full access
          </p>
        </form>
      </div>
    </div>
  )
}
