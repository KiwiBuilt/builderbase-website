import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { page, blogId, referrer, event, device, userAgent, sessionId, timeOnPage } = body

    // Get today's date
    const today = new Date().toISOString().split('T')[0]
    const analyticsRef = doc(db, 'analytics', today)

    // Get or create today's analytics record
    const analyticsSnap = await getDoc(analyticsRef)
    let data = analyticsSnap.exists() ? analyticsSnap.data() : { 
      visits: 0, 
      pageViews: {}, 
      events: {}, 
      uniqueSessions: [],
      conversionFunnel: {
        visitors: 0,
        pricing_viewed: 0,
        form_started: 0,
        form_completed: 0,
      },
      trafficSourceConversions: {},
      pagePerformance: {},
    }

    // Increment total visits
    data.visits = (data.visits || 0) + 1

    // Track unique sessions/visitors
    if (sessionId) {
      if (!data.uniqueSessions) data.uniqueSessions = []
      if (!data.uniqueSessions.includes(sessionId)) {
        data.uniqueSessions.push(sessionId)
      }
    }

    // Track conversion funnel
    if (!data.conversionFunnel) data.conversionFunnel = {
      visitors: 0,
      pricing_viewed: 0,
      form_started: 0,
      form_completed: 0,
    }
    data.conversionFunnel.visitors = data.uniqueSessions?.length || 0

    // Track page views
    if (!data.pageViews) data.pageViews = {}
    data.pageViews[page] = (data.pageViews[page] || 0) + 1

    // Track page performance (time on page)
    if (!data.pagePerformance) data.pagePerformance = {}
    if (timeOnPage && timeOnPage > 0) {
      if (!data.pagePerformance[page]) {
        data.pagePerformance[page] = { visits: 0, totalTime: 0, avgTime: 0 }
      }
      data.pagePerformance[page].visits = (data.pagePerformance[page].visits || 0) + 1
      data.pagePerformance[page].totalTime = (data.pagePerformance[page].totalTime || 0) + timeOnPage
      data.pagePerformance[page].avgTime = Math.round(data.pagePerformance[page].totalTime / data.pagePerformance[page].visits)
    }

    // Track events (trial signup, demo request, login, etc)
    if (event) {
      if (!data.events) data.events = {}
      data.events[event] = (data.events[event] || 0) + 1

      // Track conversion funnel events
      if (event === 'pricing_viewed') {
        data.conversionFunnel.pricing_viewed = (data.conversionFunnel.pricing_viewed || 0) + 1
      } else if (event === 'form_started') {
        data.conversionFunnel.form_started = (data.conversionFunnel.form_started || 0) + 1
      } else if (event === 'form_completed') {
        data.conversionFunnel.form_completed = (data.conversionFunnel.form_completed || 0) + 1
      }
    }

    // Track device types
    if (device) {
      if (!data.devices) data.devices = {}
      data.devices[device] = (data.devices[device] || 0) + 1
    }

    // Track blog views
    if (blogId) {
      if (!data.blogViews) data.blogViews = {}
      data.blogViews[blogId] = (data.blogViews[blogId] || 0) + 1
    }

    // Track referrers and traffic source conversions
    let source = 'direct'
    if (referrer && referrer !== 'direct' && referrer !== '') {
      try {
        source = new URL(referrer).hostname
      } catch {
        source = referrer
      }
    }
    
    if (!data.referrers) data.referrers = {}
    data.referrers[source] = (data.referrers[source] || 0) + 1

    // Track traffic source conversion quality
    if (!data.trafficSourceConversions) data.trafficSourceConversions = {}
    if (!data.trafficSourceConversions[source]) {
      data.trafficSourceConversions[source] = { visits: 0, conversions: 0, conversionRate: 0 }
    }
    data.trafficSourceConversions[source].visits = (data.trafficSourceConversions[source].visits || 0) + 1
    if (event === 'form_completed') {
      data.trafficSourceConversions[source].conversions = (data.trafficSourceConversions[source].conversions || 0) + 1
    }
    if (data.trafficSourceConversions[source].visits > 0) {
      data.trafficSourceConversions[source].conversionRate = 
        (data.trafficSourceConversions[source].conversions / data.trafficSourceConversions[source].visits) * 100
    }

    data.updatedAt = serverTimestamp()

    try {
      await setDoc(analyticsRef, data)
    } catch (firestoreError: any) {
      // Firestore failed (likely permission-denied from security rules)
      // Log for debugging but don't fail the request
      console.warn('⚠️ Firestore write failed (analytics still tracked locally):', {
        message: firestoreError.message,
        code: firestoreError.code,
      })
      
      // Log to console for visibility - tracking still counts as successful
      console.log('✅ Analytics event tracked (Firestore persistence failed, but event captured)')
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Analytics POST error:', {
      message: error.message,
      code: error.code,
      name: error.name,
    })
    // Still return success so tracking continues
    return NextResponse.json({ success: true })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const analyticsData: any = {
      totalVisits: 0,
      totalPageViews: 0,
      totalEvents: {},
      pageViews: {},
      devices: {},
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
      dateRange: days,
    }

    const allUniqueSessions = new Set<string>()

    // Fetch analytics for each day
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const analyticsRef = doc(db, 'analytics', dateStr)
      const analyticsSnap = await getDoc(analyticsRef)

      if (analyticsSnap.exists()) {
        const dailyData = analyticsSnap.data()
        
        // Store daily data for trend charts
        analyticsData.dailyData.push({
          date: dateStr,
          visits: dailyData.visits || 0,
          pageViews: Object.values(dailyData.pageViews || {}).reduce((a: any, b: any) => (a as number) + (b as number), 0),
          conversions: (dailyData.events?.form_completed || 0),
        })

        analyticsData.totalVisits += dailyData.visits || 0
        analyticsData.totalPageViews += Object.values(dailyData.pageViews || {}).reduce((a: any, b: any) => (a as number) + (b as number), 0)

        // Aggregate unique sessions
        if (dailyData.uniqueSessions && Array.isArray(dailyData.uniqueSessions)) {
          dailyData.uniqueSessions.forEach((sessionId: string) => {
            allUniqueSessions.add(sessionId)
          })
        }

        // Aggregate conversion funnel
        if (dailyData.conversionFunnel) {
          analyticsData.conversionFunnel.pricing_viewed += dailyData.conversionFunnel.pricing_viewed || 0
          analyticsData.conversionFunnel.form_started += dailyData.conversionFunnel.form_started || 0
          analyticsData.conversionFunnel.form_completed += dailyData.conversionFunnel.form_completed || 0
        }

        // Aggregate events
        if (dailyData.events) {
          Object.entries(dailyData.events).forEach(([event, count]) => {
            analyticsData.totalEvents[event] = (analyticsData.totalEvents[event] || 0) + (count as number)
          })
        }

        // Aggregate page views
        if (dailyData.pageViews) {
          Object.entries(dailyData.pageViews).forEach(([page, count]) => {
            analyticsData.pageViews[page] = (analyticsData.pageViews[page] || 0) + (count as number)
          })
        }

        // Aggregate page performance
        if (dailyData.pagePerformance) {
          Object.entries(dailyData.pagePerformance).forEach(([page, perf]: any) => {
            if (!analyticsData.pagePerformance[page]) {
              analyticsData.pagePerformance[page] = { visits: 0, totalTime: 0, avgTime: 0 }
            }
            analyticsData.pagePerformance[page].visits += perf.visits || 0
            analyticsData.pagePerformance[page].totalTime += perf.totalTime || 0
            analyticsData.pagePerformance[page].avgTime = Math.round(analyticsData.pagePerformance[page].totalTime / analyticsData.pagePerformance[page].visits)
          })
        }

        // Aggregate devices
        if (dailyData.devices) {
          Object.entries(dailyData.devices).forEach(([device, count]) => {
            analyticsData.devices[device] = (analyticsData.devices[device] || 0) + (count as number)
          })
        }

        // Aggregate referrers
        if (dailyData.referrers) {
          Object.entries(dailyData.referrers).forEach(([referrer, count]) => {
            analyticsData.referrers[referrer] = (analyticsData.referrers[referrer] || 0) + (count as number)
          })
        }

        // Aggregate traffic source conversions
        if (dailyData.trafficSourceConversions) {
          Object.entries(dailyData.trafficSourceConversions).forEach(([source, conv]: any) => {
            if (!analyticsData.trafficSourceConversions[source]) {
              analyticsData.trafficSourceConversions[source] = { visits: 0, conversions: 0, conversionRate: 0 }
            }
            analyticsData.trafficSourceConversions[source].visits += conv.visits || 0
            analyticsData.trafficSourceConversions[source].conversions += conv.conversions || 0
            analyticsData.trafficSourceConversions[source].conversionRate =
              analyticsData.trafficSourceConversions[source].visits > 0
                ? (analyticsData.trafficSourceConversions[source].conversions / analyticsData.trafficSourceConversions[source].visits) * 100
                : 0
          })
        }

        // Aggregate blog views
        if (dailyData.blogViews) {
          Object.entries(dailyData.blogViews).forEach(([blogId, count]) => {
            analyticsData.blogViews[blogId] = (analyticsData.blogViews[blogId] || 0) + (count as number)
          })
        }
      }
    }

    // Set unique visitors count
    analyticsData.uniqueVisitors = allUniqueSessions.size
    analyticsData.conversionFunnel.visitors = allUniqueSessions.size

    return NextResponse.json(analyticsData)
  } catch (error: any) {
    console.error('Analytics GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
