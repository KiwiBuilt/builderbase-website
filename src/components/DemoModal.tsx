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
      await fetch('https://formsubmit.co/ajax/office@builderbase.co.nz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(Object.fromEntries(formData))
      })
      
      setSubmitted(true)
    } catch (error) {
      // Even if there's an error, show success message
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#EAB308' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-4 text-gray-900">Thank You!</h3>
          <p className="text-gray-600 mb-8">
            We&apos;ll contact you within 24 hours to schedule your personalized demo.
          </p>
          <button
            onClick={() => {
              setSubmitted(false)
              onClose()
            }}
            className="btn-primary w-full"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Schedule a Demo</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* FormSubmit Configuration */}
          <input type="hidden" name="_subject" value="New Demo Request - BUILDER BASE" />
          
          {/* Name */}
          <div>
            <label htmlFor="demo_name" className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              id="demo_name"
              name="name"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="John Smith"
            />
          </div>

          {/* Company Name */}
          <div>
            <label htmlFor="demo_company" className="block text-sm font-semibold text-gray-700 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              id="demo_company"
              name="company"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="ABC Construction Ltd"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="demo_email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="demo_email"
              name="email"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="john@abcconstruction.co.nz"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="demo_phone" className="block text-sm font-semibold text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              id="demo_phone"
              name="phone"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="021 123 4567"
            />
          </div>

          {/* Team Size */}
          <div>
            <label htmlFor="demo_team_size" className="block text-sm font-semibold text-gray-700 mb-2">
              How many team members? *
            </label>
            <select
              id="demo_team_size"
              name="team_size"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
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
            <label htmlFor="demo_interests" className="block text-sm font-semibold text-gray-700 mb-2">
              What would you like to see in the demo? *
            </label>
            <textarea
              id="demo_interests"
              name="demo_interests"
              required
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="e.g., Job costing, team scheduling, client portals..."
            />
          </div>

          {/* Biggest Challenge */}
          <div>
            <label htmlFor="demo_challenge" className="block text-sm font-semibold text-gray-700 mb-2">
              What&apos;s your biggest challenge right now? (Optional)
            </label>
            <textarea
              id="demo_challenge"
              name="biggest_challenge"
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="e.g., Tracking job costs, managing multiple sites..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-primary w-full text-base py-4"
          >
            Request Demo
          </button>

          <p className="text-xs text-gray-500 text-center">
            We&apos;ll contact you to schedule a time that works for you.
          </p>
        </form>
      </div>
    </div>
  )
}
