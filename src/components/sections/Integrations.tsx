export default function Integrations() {
  const integrations = [
    {
      name: 'Xero',
      description: 'Sync invoices and financial data seamlessly with Xero accounting software.',
      icon: '📊',
    },
    {
      name: 'Stripe',
      description: 'Accept online payments securely through Stripe payment processing.',
      icon: '💳',
    },
    {
      name: 'Google Calendar',
      description: 'Sync your project schedules and team calendars with Google Calendar.',
      icon: '📅',
    },
    {
      name: 'Slack',
      description: 'Get notifications and stay connected through Slack integrations.',
      icon: '💬',
    },
  ]

  return (
    <section className="bg-white" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">Integrations That Work Together</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Connect your favorite tools and automate your workflow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {integrations.map((integration, idx) => (
            <div key={idx} className="p-8 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 text-center">
              <div className="text-5xl mb-4">{integration.icon}</div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900">{integration.name}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{integration.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center rounded-2xl p-10 bg-gray-50">
          <p className="text-base text-gray-700 mb-6">
            Don't see your favorite app? We're constantly adding new integrations.
          </p>
          <button className="btn-outline">
            Request an Integration
          </button>
        </div>
      </div>
    </section>
  )
}
