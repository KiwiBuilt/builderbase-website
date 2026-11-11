import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { describeBlogAdminError } from '@/lib/blog-admin'
import { deleteGalleryImage, listGalleryImages, uploadGalleryImage } from '@/lib/gallery-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const noStore = { 'Cache-Control': 'no-store' }

function unauthorized() {
  return NextResponse.json({ error: 'Sign in to manage images.' }, { status: 401, headers: noStore })
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    const images = await listGalleryImages()
    return NextResponse.json({ images }, { headers: noStore })
  } catch (error) {
    const failure = describeBlogAdminError(error, 'Could not update the gallery.')
    return NextResponse.json(failure.body, { status: failure.status, headers: noStore })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Choose an image to upload.' }, { status: 400, headers: noStore })
    }
    const bytes = Buffer.from(await file.arrayBuffer())
    const image = await uploadGalleryImage({ name: file.name, type: file.type, bytes })
    return NextResponse.json({ image }, { headers: noStore })
  } catch (error) {
    const failure = describeBlogAdminError(error, 'Could not update the gallery.')
    return NextResponse.json(failure.body, { status: failure.status, headers: noStore })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    const name = request.nextUrl.searchParams.get('name') || ''
    await deleteGalleryImage(name)
    return NextResponse.json({ success: true }, { headers: noStore })
  } catch (error) {
    const failure = describeBlogAdminError(error, 'Could not update the gallery.')
    return NextResponse.json(failure.body, { status: failure.status, headers: noStore })
  }
}
