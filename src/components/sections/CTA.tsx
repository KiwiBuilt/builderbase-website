export default function CTA() {
  return (
    <section className="py-48 bg-gray-900">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Ready to Transform Your Construction Business?
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Join hundreds of New Zealand builders already using BUILDER BASE. Start your free 14-day trial today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button className="px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity" style={{ backgroundColor: '#EAB308', color: '#111827' }}>
              Start Your Free Trial
            </button>
            <button className="text-white font-semibold border-2 border-white px-8 py-4 rounded-lg hover:bg-white hover:text-gray-900 transition-colors">
              Schedule a Demo
            </button>
          </div>

          <p className="text-sm text-gray-400">
            No credit card required. Cancel anytime.
          </p>
        </div>
      </div>
    </section>
  )
}
