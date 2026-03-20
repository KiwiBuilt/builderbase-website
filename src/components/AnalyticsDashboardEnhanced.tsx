'use client'

import { useEffect, useState } from 'react'

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState(7)

  useEffect(() => {
    loadAnalytics()
  }, [selectedPeriod])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics?days=${selectedPeriod}`)
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data)
      } else {
        // Set default empty analytics
        setAnalytics({
          totalVisits: 0,
          totalPageViews: 0,
          totalEvents: { trial_signup: 0, demo_request: 0, login: 0 },
          pageViews: {},
          devices: { desktop: 0, mobile: 0, tablet: 0 },
          referrers: {},
          blogViews: {},
          uniqueVisitors: 0,
          conversionFunnel: {
            visitors: 0,
            pricing_viewed: 0,
            form_started: 0,
            form_completed: 0,
          },
          trafficSourceConversions: {},
          pagePerformance: {},
          dailyData: [],
        })
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
      setAnalytics({
        totalVisits: 0,
        totalPageViews: 0,
        totalEvents: { trial_signup: 0, demo_request: 0, login: 0 },
        pageViews: {},
        devices: { desktop: 0, mobile: 0, tablet: 0 },
        referrers: {},
        blogViews: {},
        uniqueVisitors: 0,
        conversionFunnel: {
          visitors: 0,
          pricing_viewed: 0,
          form_started: 0,
          form_completed: 0,
        },
        trafficSourceConversions: {},
        pagePerformance: {},
        dailyData: [],
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <p style={{ color: '#6B7280' }}>Loading analytics...</p>
      </div>
    )
  }

  // Calculate conversion metrics
  const funnel = analytics.conversionFunnel || {}
  const baseConversions = funnel.form_completed || 0
  const loginAttempts = analytics.totalEvents?.['login'] || 0
  const pricingViews = funnel.pricing_viewed || 0
  const formsStarted = funnel.form_started || 0
  const formsCompleted = funnel.form_completed || 0
  const devices = (analytics?.devices || {}) as Record<string, any>
  const totalDevices: number = Object.values(devices).reduce((a: number, b: any) => a + (typeof b === 'number' ? b : 0), 0)

  // Get top pages
  const topPages = Object.entries(analytics.pageViews || {})
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 5)

  // Get traffic sources
  const referrers = analytics.referrers || {}
  const topReferrers = Object.entries(referrers)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 5)

  // Get traffic source conversion rates
  const sourceConversions = Object.entries(analytics.trafficSourceConversions || {})
    .map(([source, data]: any) => ({
      source,
      visits: data.visits || 0,
      conversions: data.conversions || 0,
      rate: (data.conversionRate || 0).toFixed(2),
    }))
    .sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate))

  // Calculate form completion rate
  const formCompletionRate = formsStarted > 0 ? ((formsCompleted / formsStarted) * 100).toFixed(1) : '0.0'

  // Conversion funnel drop-off
  const visitorsToPricingRate = funnel.visitors > 0 ? ((pricingViews / funnel.visitors) * 100).toFixed(1) : '0.0'
  const pricingToFormRate = pricingViews > 0 ? ((formsStarted / pricingViews) * 100).toFixed(1) : '0.0'
  const formToCompleteRate = formsStarted > 0 ? ((formsCompleted / formsStarted) * 100).toFixed(1) : '0.0'

  // Calculate daily data max for scaling charts
  const dailyVisits = analytics.dailyData?.map((d: any) => d.visits) || []
  const dailyConversions = analytics.dailyData?.map((d: any) => d.conversions) || []
  const maxVisits = Math.max(...dailyVisits, 1)
  const maxConversions = Math.max(...dailyConversions, 1)

  return (
    <div style={{ padding: '24px' }}>
      {/* Header with Period Selector */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#111827' }}>
          Website Analytics
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[7, 30, 90].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              style={{
                padding: '10px 16px',
                backgroundColor: selectedPeriod === period ? '#EAB308' : '#F3F4F6',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                color: selectedPeriod === period ? '#111827' : '#6B7280',
              }}
            >
              Last {period} days
            </button>
          ))}
        </div>
      </div>

      {/* KEY METRICS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          marginBottom: '32px',
        }}
      >
        {[
          { label: '👥 Visitors', value: analytics.totalVisits.toLocaleString(), color: '#3B82F6' },
          { label: '🆕 NEW', value: (analytics.uniqueVisitors || 0).toLocaleString(), color: '#10B981' },
          { label: '📄 Page Views', value: analytics.totalPageViews.toLocaleString(), color: '#F59E0B' },
          { label: '🎯 Trials Started', value: formsStarted, color: '#EAB308' },
          { label: '✅ Completed', value: formsCompleted, color: '#06B6D4' },
          { label: '💹 Completion %', value: `${formCompletionRate}%`, color: '#8B5CF6' },
        ].map((metric, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>{metric.label}</p>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: metric.color }}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      {/* DAILY TREND GRAPHS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
        }}
      >
        {/* Visitors Trend */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '16px', color: '#111827' }}>
            👥 Visitors per Day
          </h3>
          <div style={{ height: '150px', position: 'relative', backgroundColor: '#F9FAFB', borderRadius: '8px', padding: '8px' }}>
            <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 300 120" preserveAspectRatio="none">
              {analytics.dailyData?.map((day: any, idx: number) => {
                const x = (idx / Math.max(analytics.dailyData.length - 1, 1)) * 300
                const y = 120 - (day.visits / maxVisits) * 100
                return (
                  <g key={idx}>
                    <circle cx={x} cy={y} r="3" fill="#3B82F6" />
                    {idx < analytics.dailyData.length - 1 && (
                      <line
                        x1={x}
                        y1={y}
                        x2={(idx + 1) / Math.max(analytics.dailyData.length - 1, 1) * 300}
                        y2={120 - (analytics.dailyData[idx + 1].visits / maxVisits) * 100}
                        stroke="#3B82F6"
                        strokeWidth="2"
                      />
                    )}
                  </g>
                )
              })}
            </svg>
          </div>
          <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>
            Avg: {Math.round(analytics.totalVisits / Math.max(analytics.dailyData?.length || 1, 1))} visitors/day
          </p>
        </div>

        {/* Conversions Trend */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '16px', color: '#111827' }}>
            🎯 Conversions per Day
          </h3>
          <div style={{ height: '150px', position: 'relative', backgroundColor: '#F9FAFB', borderRadius: '8px', padding: '8px' }}>
            <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 300 120" preserveAspectRatio="none">
              {analytics.dailyData?.map((day: any, idx: number) => {
                const x = (idx / Math.max(analytics.dailyData.length - 1, 1)) * 300
                const y = 120 - (day.conversions / Math.max(maxConversions, 1)) * 100
                return (
                  <g key={idx}>
                    <circle cx={x} cy={y} r="3" fill="#10B981" />
                    {idx < analytics.dailyData.length - 1 && (
                      <line
                        x1={x}
                        y1={y}
                        x2={(idx + 1) / Math.max(analytics.dailyData.length - 1, 1) * 300}
                        y2={120 - (analytics.dailyData[idx + 1].conversions / Math.max(maxConversions, 1)) * 100}
                        stroke="#10B981"
                        strokeWidth="2"
                      />
                    )}
                  </g>
                )
              })}
            </svg>
          </div>
          <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>
            Total: {formsCompleted} conversions
          </p>
        </div>
      </div>

      {/* CONVERSION FUNNEL */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '24px', color: '#111827' }}>
          🔄 Conversion Funnel
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { label: '1. Site Visitors', value: funnel.visitors || 0, color: '#3B82F6', percentage: 100 },
            { label: '2. Viewed Pricing', value: pricingViews, color: '#F59E0B', percentage: visitorsToPricingRate },
            { label: '3. Started Form', value: formsStarted, color: '#8B5CF6', percentage: pricingToFormRate },
            { label: '4. Completed Form', value: formsCompleted, color: '#10B981', percentage: formToCompleteRate },
          ].map((step, idx) => (
            <div key={idx}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{step.label}</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: step.color }}>
                  {step.value.toLocaleString()} ({step.percentage}%)
                </span>
              </div>
              <div style={{ height: '24px', backgroundColor: '#E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    backgroundColor: step.color,
                    width: `${step.percentage}%`,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TRAFFIC SOURCE CONVERSION QUALITY */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#111827' }}>
          🌐 Traffic Source Quality
        </h3>
        {sourceConversions.length === 0 ? (
          <p style={{ color: '#9CA3AF' }}>No conversion data yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sourceConversions.map((source: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '4px', textTransform: 'capitalize' }}>
                    {source.source}
                  </p>
                  <p style={{ fontSize: '12px', color: '#6B7280' }}>
                    {source.visits} visits, {source.conversions} conversions
                  </p>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10B981' }}>
                  {source.rate}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TOP PAGES BY VIEWS */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#111827' }}>
          📊 Top Pages
        </h3>
        {topPages.length === 0 ? (
          <p style={{ color: '#9CA3AF' }}>No page views yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topPages.map(([page, views], idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                <span style={{ fontSize: '14px', color: '#111827' }}>
                  {idx + 1}. {page || '/(home)'}
                </span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#3B82F6' }}>
                  {(views as number).toLocaleString()} views
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DEVICES */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#111827' }}>
          📱 Device Types
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Object.entries(devices).map(([device, count]: [string, any]) => (
            <div key={device} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#6B7280', textTransform: 'capitalize' }}>
                {device === 'desktop' ? '💻' : '📱'} {device}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '80px',
                    height: '8px',
                    backgroundColor: '#E5E7EB',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      backgroundColor: '#EAB308',
                      width: `${totalDevices > 0 ? ((count as number) / totalDevices) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827', minWidth: '40px', textAlign: 'right' }}>
                  {count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
