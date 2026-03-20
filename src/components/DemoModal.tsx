'use client'

import { useState } from 'react'

interface DemoModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const [submitted, setSubmitted] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const form = e.currentTarget
    const formData = new FormData(form)
    
    try {
      const response = await fetch('/api/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(Object.fromEntries(formData))
      })
      
      if (response.ok) {
        setSubmitted(true)
      } else {
        console.error('Failed to send demo request')
        setSubmitted(true) // Still show success to user
      }
    } catch (error) {
      console.error('Error submitting demo form:', error)
      setSubmitted(true) // Still show success to user
    }
  }

  if (submitted) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)'
        }}
      >
        <div 
          className="bg-white w-full text-center"
          style={{
            maxWidth: '500px',
            borderRadius: '24px',
            padding: '48px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div style={{ marginBottom: '32px' }}>
            <div 
              className="mx-auto flex items-center justify-center"
              style={{ 
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: '#FEF3C7'
              }}
            >
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#EAB308' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h3 className="font-bold mb-4 text-gray-900" style={{ fontSize: '32px' }}>Thank You!</h3>
          <p className="text-gray-600 leading-relaxed" style={{ fontSize: '18px', marginBottom: '32px' }}>
            We&apos;ll contact you within 24 hours to schedule your personalized demo.
          </p>
          <button
            onClick={() => {
              setSubmitted(false)
              onClose()
            }}
            className="w-full font-semibold transition-all hover:opacity-90"
            style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: '#EAB308',
              color: '#111827',
              fontSize: '16px'
            }}
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
            <h3 className="font-bold text-gray-900 mb-2" style={{ fontSize: '32px' }}>Schedule a Demo</h3>
            <p className="text-gray-600" style={{ fontSize: '16px' }}>See BUILDER BASE in action</p>
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
          {/* Name */}
          <div>
            <label htmlFor="demo_name" className="block font-semibold text-gray-800 mb-2" style={{ fontSize: '14px' }}>
              Full Name *
            </label>
            <input
              type="text"
              id="demo_name"
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
            <label htmlFor="demo_company" className="block font-semibold text-gray-800 mb-2" style={{ fontSize: '14px' }}>
              Company Name *
            </label>
            <input
              type="text"
              id="demo_company"
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
            <label htmlFor="demo_email" className="block font-semibold text-gray-800 mb-2" style={{ fontSize: '14px' }}>
              Email Address *
            </label>
            <input
              type="email"
              id="demo_email"
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
            <label htmlFor="demo_phone" className="block font-semibold text-gray-800 mb-2" style={{ fontSize: '14px' }}>
              Phone Number *
            </label>
            <input
              type="tel"
              id="demo_phone"
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
            <label htmlFor="demo_team_size" className="block font-semibold text-gray-800 mb-2" style={{ fontSize: '14px' }}>
              How many team members? *
            </label>
            <select
              id="demo_team_size"
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

          {/* What to see in demo */}
          <div>
            <label htmlFor="demo_interests" className="block font-semibold text-gray-800 mb-2" style={{ fontSize: '14px' }}>
              What would you like to see in the demo? *
            </label>
            <textarea
              id="demo_interests"
              name="demo_interests"
              required
              rows={3}
              className="w-full bg-white text-gray-900 outline-none transition-all resize-none"
              style={{
                padding: '14px 16px',
                border: '2px solid #E5E7EB',
                borderRadius: '12px',
                fontSize: '16px'
              }}
              placeholder="e.g., Job costing, team scheduling, client portals..."
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

          {/* Biggest Challenge */}
          <div>
            <label htmlFor="demo_challenge" className="block font-semibold text-gray-800 mb-2" style={{ fontSize: '14px' }}>
              What&apos;s your biggest challenge right now? (Optional)
            </label>
            <textarea
              id="demo_challenge"
              name="biggest_challenge"
              rows={2}
              className="w-full bg-white text-gray-900 outline-none transition-all resize-none"
              style={{
                padding: '14px 16px',
                border: '2px solid #E5E7EB',
                borderRadius: '12px',
                fontSize: '16px'
              }}
              placeholder="e.g., Tracking job costs, managing multiple sites..."
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

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full font-semibold transition-all hover:opacity-90"
            style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: '#EAB308',
              color: '#111827',
              fontSize: '16px',
              marginTop: '8px'
            }}
          >
            Request Demo
          </button>

          <p className="text-gray-500 text-center" style={{ fontSize: '14px', marginTop: '8px' }}>
            We&apos;ll contact you to schedule a time that works for you.
          </p>
        </form>
      </div>
    </div>
  )
}
