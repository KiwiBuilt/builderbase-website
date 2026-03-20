import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { page, blogId, referrer, event, device, userAgent } = body

    // Get today's date
    const today = new Date().toISOString().split('T')[0]
    const analyticsRef = doc(db, 'analytics', today)

    // Get or create today's analytics record
    const analyticsSnap = await getDoc(analyticsRef)
    let data = analyticsSnap.exists() ? analyticsSnap.data() : { visits: 0, pageViews: {}, events: {} }

    // Increment total visits
    data.visits = (data.visits || 0) + 1

    // Track page views
    if (!data.pageViews) data.pageViews = {}
    data.pageViews[page] = (data.pageViews[page] || 0) + 1

    // Track events (trial signup, demo request, login, etc)
    if (event) {
      if (!data.events) data.events = {}
      data.events[event] = (data.events[event] || 0) + 1
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

    // Track referrers
    if (referrer && referrer !== 'direct' && referrer !== '') {
      if (!data.referrers) data.referrers = {}
      data.referrers[referrer] = (data.referrers[referrer] || 0) + 1
    } else {
      if (!data.referrers) data.referrers = {}
      data.referrers['direct'] = (data.referrers['direct'] || 0) + 1
    }

    data.updatedAt = serverTimestamp()

    await setDoc(analyticsRef, data)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
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
      dateRange: days,
    }

    // Fetch analytics for each day
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const analyticsRef = doc(db, 'analytics', dateStr)
      const analyticsSnap = await getDoc(analyticsRef)

      if (analyticsSnap.exists()) {
        const dailyData = analyticsSnap.data()
        analyticsData.totalVisits += dailyData.visits || 0
        analyticsData.totalPageViews += Object.values(dailyData.pageViews || {}).reduce((a: any, b: any) => (a as number) + (b as number), 0)

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

        // Aggregate blog views
        if (dailyData.blogViews) {
          Object.entries(dailyData.blogViews).forEach(([blogId, count]) => {
            analyticsData.blogViews[blogId] = (analyticsData.blogViews[blogId] || 0) + (count as number)
          })
        }
      }
    }

    return NextResponse.json(analyticsData)
  } catch (error: any) {
    console.error('Analytics GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
