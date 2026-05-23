import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { resolveWebsitePath } from '@/lib/project-paths'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params
    const imagePath = slug.join('/')
    const baseDir = resolveWebsitePath('images')
    const fullPath = path.join(baseDir, imagePath)

    // Security: prevent directory traversal
    const realPath = path.resolve(fullPath)
    const resolvedBaseDir = path.resolve(baseDir)
    if (!realPath.startsWith(resolvedBaseDir)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 })
    }

    if (!fs.existsSync(realPath)) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    const fileBuffer = fs.readFileSync(realPath)
    const ext = path.extname(realPath).toLowerCase()
    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml'
    }

    const contentType = mimeTypes[ext] || 'application/octet-stream'

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    })
  } catch (error) {
    console.error('Image serving error:', error)
    return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 })
  }
}
