// app/api/bilibili/validate-url/route.ts
// API route for validating Bilibili video URLs

import { NextRequest, NextResponse } from 'next/server'
import { extractVideoId, isValidBilibiliUrl } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const url = body.url

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_PARAMS',
            message: '缺少必要参数：url',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      )
    }

    // Validate URL format
    if (!isValidBilibiliUrl(url)) {
      return NextResponse.json({
        valid: false,
        videoId: null,
        urlType: null,
      })
    }

    // Extract video ID
    const videoId = extractVideoId(url)

    if (!videoId) {
      return NextResponse.json({
        valid: false,
        videoId: null,
        urlType: null,
      })
    }

    // Determine URL type (BV or av)
    const urlType = videoId.startsWith('BV') ? 'BV' : 'AV'

    return NextResponse.json({
      valid: true,
      videoId,
      urlType,
    })
  } catch (error) {
    console.error('Error validating URL:', error)

    return NextResponse.json(
      {
        error: {
          code: 'FETCH_FAILED',
          message: 'URL验证失败',
          details: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    )
  }
}

