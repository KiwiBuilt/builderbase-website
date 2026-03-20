export default function ForClients() {
  const benefits = [
    {
      title: 'Real-time Project Visibility',
      description: 'See exactly where your project stands with daily updates, photos, and progress reports.',
    },
    {
      title: 'Transparent Communication',
      description: 'Stay informed about timelines, budget status, and any changes to your build plan.',
    },
    {
      title: 'Photo Documentation',
      description: 'Access a complete photo library of your project at every stage of construction.',
    },
    {
      title: 'Progress Tracking',
      description: 'Know when milestones are completed and what\'s coming next with detailed timelines.',
    },
  ]

  return (
    <section id="for-clients" className="bg-white" style={{ paddingTop: '60px', paddingBottom: '60px' }}>
      <div className="container-custom">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 text-gray-900 px-4">Peace of Mind for Home Owners</h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
            Clients get transparent visibility into their building projects
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 md:mb-16">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-builder-accent)' }}>
                  <svg className="w-6 h-6 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-base md:text-lg mb-2 text-gray-900">{benefit.title}</h3>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 md:mt-16 rounded-2xl p-6 md:p-10 bg-gray-50">
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
            Included in Basic & Professional Plans
          </h3>
          <p className="text-base text-gray-700 mb-6 leading-relaxed">
            Your clients can request to join your team's client portal during onboarding. They'll get instant visibility into their projects without needing additional setup from you.
          </p>
          <ul className="space-y-3">
            {[
              'Secure client login',
              'Project progress tracking',
              'Photo galleries',
              'Timeline visibility',
              'Mobile accessible'
            ].map((item, idx) => (
              <li key={idx} className="flex items-center gap-3">
                <span className="text-builder-primary font-bold">✓</span>
                <span className="text-gray-700 text-sm md:text-base">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
