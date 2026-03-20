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
        })
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
      // Set default empty analytics on error
      setAnalytics({
        totalVisits: 0,
        totalPageViews: 0,
        totalEvents: { trial_signup: 0, demo_request: 0, login: 0 },
        pageViews: {},
        devices: { desktop: 0, mobile: 0, tablet: 0 },
        referrers: {},
        blogViews: {},
        uniqueVisitors: 0,
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
  const trialSignups = analytics.totalEvents?.['trial_signup'] || 0
  const demoRequests = analytics.totalEvents?.['demo_request'] || 0
  const loginAttempts = analytics.totalEvents?.['login'] || 0
  const conversionRate = analytics.totalVisits > 0 
    ? (((trialSignups + demoRequests) / analytics.totalVisits) * 100).toFixed(2)
    : '0.00'

  // Get top pages
  const topPages = Object.entries(analytics.pageViews || {})
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 5)

  // Get device breakdown
  const devices = (analytics?.devices || {}) as Record<string, any>
  const totalDevices: number = Object.values(devices).reduce((a: number, b: any) => a + (typeof b === 'number' ? b : 0), 0)

  // Get traffic sources
  const referrers = analytics.referrers || {}
  const topReferrers = Object.entries(referrers)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div style={{ padding: '24px' }}>
      {/* Header with Period Selector */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#111827' }}>
          Website Analytics
        </h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[7, 30, 90].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              style={{
                padding: '8px 16px',
                backgroundColor: selectedPeriod === period ? '#EAB308' : '#FFFFFF',
                border: `2px solid ${selectedPeriod === period ? '#EAB308' : '#E5E7EB'}`,
                borderRadius: '6px',
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

      {/* Key Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {/* Total Visitors */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase' }}>
            👥 Total Visitors
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>
            {analytics.totalVisits.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px' }}>
            Unique sessions
          </div>
        </div>

        {/* Unique Visitors */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase' }}>
            🆕 NEW Visitors
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10B981' }}>
            {(analytics.uniqueVisitors || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px' }}>
            First-time visitors
          </div>
        </div>

        {/* Page Views */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase' }}>
            📄 Page Views
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>
            {analytics.totalPageViews.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px' }}>
            Total views
          </div>
        </div>

        {/* Trial Signups */}
        <div
          style={{
            backgroundColor: '#FFFBEB',
            border: '2px solid #EAB308',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#B45309', marginBottom: '8px', textTransform: 'uppercase' }}>
            🎯 Trial Signups
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#92400E' }}>
            {trialSignups}
          </div>
          <div style={{ fontSize: '12px', color: '#B45309', marginTop: '8px' }}>
            Free trial clicks
          </div>
        </div>

        {/* Demo Requests */}
        <div
          style={{
            backgroundColor: '#EFF6FF',
            border: '2px solid #3B82F6',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#1E40AF', marginBottom: '8px', textTransform: 'uppercase' }}>
            📞 Demo Requests
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1E3A8A' }}>
            {demoRequests}
          </div>
          <div style={{ fontSize: '12px', color: '#1E40AF', marginTop: '8px' }}>
            Schedule demo clicks
          </div>
        </div>

        {/* Conversion Rate */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase' }}>
            💹 Conversion Rate
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>
            {conversionRate}%
          </div>
          <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px' }}>
            Trial + Demo
          </div>
        </div>

        {/* Login Attempts */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase' }}>
            🔐 Login Attempts
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>
            {loginAttempts}
          </div>
          <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px' }}>
            Admin access attempts
          </div>
        </div>
      </div>

      {/* Device Breakdown & Traffic Sources Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
        }}
      >
        {/* Device Types */}
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

        {/* Traffic Sources */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#111827' }}>
            🌐 Traffic Sources
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topReferrers.map(([referrer, count]: any) => (
              <div key={referrer} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#6B7280', textTransform: 'capitalize' }}>
                  {referrer === 'direct' ? '🔗' : '🔍'} {referrer}
                </span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Pages */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#111827' }}>
          📊 Top Pages
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {topPages.length > 0 ? (
            topPages.map(([page, count]: any, idx) => (
              <div key={page} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: idx < topPages.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                    {page}
                  </div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                    {count} views
                  </div>
                </div>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#EAB308' }}>
                  #{idx + 1}
                </span>
              </div>
            ))
          ) : (
            <p style={{ color: '#9CA3AF' }}>No page views yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
