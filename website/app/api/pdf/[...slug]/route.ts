import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params
    const pdfPath = slug.map(s => decodeURIComponent(s)).join('/')
    
    // Resolve path relative to the process CWD, which should be the root of the repo
    const baseDir = path.join(process.cwd(), 'public/kosakata-kanji')
    const fullPath = path.join(baseDir, pdfPath)

    // Security: prevent directory traversal
    const realPath = path.resolve(fullPath)
    const resolvedBaseDir = path.resolve(baseDir)
    if (!realPath.startsWith(resolvedBaseDir)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 })
    }

    if (!fs.existsSync(realPath) || !fs.statSync(realPath).isFile()) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 })
    }

    const fileBuffer = fs.readFileSync(realPath)
    const searchParams = request.nextUrl.searchParams
    const shouldDownload = searchParams.get('download') === 'true'

    const headers: Record<string, string> = {
      'Content-Type': 'application/pdf',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }

    if (shouldDownload) {
      headers['Content-Disposition'] = `attachment; filename="${path.basename(realPath)}"`
    } else {
      headers['Content-Disposition'] = `inline; filename="${path.basename(realPath)}"`
    }

    return new NextResponse(fileBuffer, { headers })
  } catch (error) {
    console.error('PDF serving error:', error)
    return NextResponse.json({ error: 'Failed to serve PDF' }, { status: 500 })
  }
}
