'use client'

import { useState } from 'react'

interface TrialModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function TrialModal({ isOpen, onClose }: TrialModalProps) {
  const [submitted, setSubmitted] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // FormSubmit will handle the actual submission
    // We just show the success message
    setTimeout(() => {
      setSubmitted(true)
    }, 100)
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
            We&apos;ll contact you within 24 hours to set up your free trial and get you started.
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
          <h3 className="text-2xl font-bold text-gray-900">Start Your Free Trial</h3>
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
          action="https://formsubmit.co/office@builderbase.co.nz"
          method="POST"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* FormSubmit Configuration */}
          <input type="hidden" name="_subject" value="New Trial Request - BUILDER BASE" />
          <input type="hidden" name="_captcha" value="false" />
          <input type="hidden" name="_template" value="table" />
          
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="John Smith"
            />
          </div>

          {/* Company Name */}
          <div>
            <label htmlFor="company" className="block text-sm font-semibold text-gray-700 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              id="company"
              name="company"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="ABC Construction Ltd"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="john@abcconstruction.co.nz"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="021 123 4567"
            />
          </div>

          {/* Team Size */}
          <div>
            <label htmlFor="team_size" className="block text-sm font-semibold text-gray-700 mb-2">
              How many team members? *
            </label>
            <select
              id="team_size"
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

          {/* Message (Optional) */}
          <div>
            <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
              Message (Optional)
            </label>
            <textarea
              id="message"
              name="message"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Tell us about your business..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-primary w-full text-base py-4"
          >
            Request Free Trial
          </button>

          <p className="text-xs text-gray-500 text-center">
            No credit card required. 14-day trial with full access.
          </p>
        </form>
      </div>
    </div>
  )
}
