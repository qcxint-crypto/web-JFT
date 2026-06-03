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
    const audioPath = slug.join('/')
    const baseDir = resolveWebsitePath('audio')
    const fullPath = path.join(baseDir, audioPath)

    // Security: prevent directory traversal
    const realPath = path.resolve(fullPath)
    const resolvedBaseDir = path.resolve(baseDir)
    if (!realPath.startsWith(resolvedBaseDir)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 })
    }

    if (!fs.existsSync(realPath)) {
      return NextResponse.json({ error: 'Audio not found' }, { status: 404 })
    }

    const fileBuffer = fs.readFileSync(realPath)
    const ext = path.extname(realPath).toLowerCase()
    const mimeTypes: Record<string, string> = {
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.m4a': 'audio/mp4',
      '.mp4': 'audio/mp4',
      '.ogg': 'audio/ogg',
      '.webm': 'audio/webm',
      '.aac': 'audio/aac'
    }

    const contentType = mimeTypes[ext] || 'application/octet-stream'

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Accept-Ranges': 'bytes'
      }
    })
  } catch (error) {
    console.error('Audio serving error:', error)
    return NextResponse.json({ error: 'Failed to serve audio' }, { status: 500 })
  }
}
