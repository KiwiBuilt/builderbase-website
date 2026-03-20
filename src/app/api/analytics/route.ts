import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { page, blogId, referrer } = body

    // Get today's date
    const today = new Date().toISOString().split('T')[0]
    const analyticsRef = doc(db, 'analytics', today)

    // Get or create today's analytics record
    const analyticsSnap = await getDoc(analyticsRef)
    let data = analyticsSnap.exists() ? analyticsSnap.data() : { visits: 0, pageViews: {} }

    // Increment total visits
    data.visits = (data.visits || 0) + 1

    // Track page views
    if (!data.pageViews) data.pageViews = {}
    data.pageViews[page] = (data.pageViews[page] || 0) + 1

    // Track blog views
    if (blogId) {
      if (!data.blogViews) data.blogViews = {}
      data.blogViews[blogId] = (data.blogViews[blogId] || 0) + 1
    }

    // Track referrers
    if (referrer && referrer !== 'direct') {
      if (!data.referrers) data.referrers = {}
      data.referrers[referrer] = (data.referrers[referrer] || 0) + 1
    }

    data.updatedAt = serverTimestamp()

    await setDoc(analyticsRef, data)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
