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
            We&apos;ll contact you within 24 hours to schedule your personalized demo.
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
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-10 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">Schedule a Demo</h3>
            <p className="text-gray-600">See BUILDER BASE in action</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* Name */}
          <div>
            <label htmlFor="demo_name" className="block text-sm font-semibold text-gray-800 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              id="demo_name"
              name="name"
              required
              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all outline-none text-gray-900"
              placeholder="John Smith"
            />
          </div>

          {/* Company Name */}
          <div>
            <label htmlFor="demo_company" className="block text-sm font-semibold text-gray-800 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              id="demo_company"
              name="company"
              required
              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all outline-none text-gray-900"
              placeholder="ABC Construction Ltd"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="demo_email" className="block text-sm font-semibold text-gray-800 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="demo_email"
              name="email"
              required
              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all outline-none text-gray-900"
              placeholder="john@abcconstruction.co.nz"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="demo_phone" className="block text-sm font-semibold text-gray-800 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              id="demo_phone"
              name="phone"
              required
              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all outline-none text-gray-900"
              placeholder="021 123 4567"
            />
          </div>

          {/* Team Size */}
          <div>
            <label htmlFor="demo_team_size" className="block text-sm font-semibold text-gray-800 mb-2">
              How many team members? *
            </label>
            <select
              id="demo_team_size"
              name="team_size"
              required
              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all outline-none text-gray-900 bg-white"
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
            <label htmlFor="demo_interests" className="block text-sm font-semibold text-gray-800 mb-2">
              What would you like to see in the demo? *
            </label>
            <textarea
              id="demo_interests"
              name="demo_interests"
              required
              rows={3}
              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all outline-none text-gray-900 resize-none"
              placeholder="e.g., Job costing, team scheduling, client portals..."
            />
          </div>

          {/* Biggest Challenge */}
          <div>
            <label htmlFor="demo_challenge" className="block text-sm font-semibold text-gray-800 mb-2">
              What&apos;s your biggest challenge right now? (Optional)
            </label>
            <textarea
              id="demo_challenge"
              name="biggest_challenge"
              rows={2}
              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all outline-none text-gray-900 resize-none"
              placeholder="e.g., Tracking job costs, managing multiple sites..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 rounded-xl font-semibold text-base transition-all hover:opacity-90 mt-6"
            style={{ backgroundColor: '#EAB308', color: '#111827' }}
          >
            Request Demo
          </button>

          <p className="text-sm text-gray-500 text-center pt-2">
            We&apos;ll contact you to schedule a time that works for you.
          </p>
        </form>
      </div>
    </div>
  )
}
