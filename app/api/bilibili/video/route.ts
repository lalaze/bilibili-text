// app/api/bilibili/video/route.ts
// API route for fetching Bilibili video metadata

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get('videoId')

  if (!videoId) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_PARAMS',
          message: '缺少必要参数：videoId',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 400 }
    )
  }

  // Validate video ID format (BV or av)
  if (!videoId.match(/^(BV[\w]+|av\d+)$/)) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_VIDEO_ID',
          message: '视频ID格式无效',
          details: '视频ID必须是BV或av格式',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 400 }
    )
  }

  try {
    // Fetch video info from Bilibili API
    // Use web-interface/view endpoint for basic video info
    const apiUrl = videoId.startsWith('BV')
      ? `https://api.bilibili.com/x/web-interface/view?bvid=${videoId}`
      : `https://api.bilibili.com/x/web-interface/view?aid=${videoId.substring(2)}`

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.bilibili.com',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        {
          error: {
            code: 'FETCH_FAILED',
            message: '获取视频信息失败',
            details: `HTTP ${response.status}`,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 500 }
      )
    }

    const data = await response.json()

    // Check Bilibili API response code
    if (data.code !== 0) {
      if (data.code === -404 || data.code === 62002) {
        return NextResponse.json(
          {
            error: {
              code: 'VIDEO_NOT_FOUND',
              message: '视频不存在或已被删除',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        )
      }

      if (data.code === -403) {
        return NextResponse.json(
          {
            error: {
              code: 'VIDEO_RESTRICTED',
              message: '视频受地区限制或需要登录',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 403 }
        )
      }

      return NextResponse.json(
        {
          error: {
            code: 'FETCH_FAILED',
            message: '获取视频信息失败',
            details: `Bilibili API 错误: ${data.message || data.code}`,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 500 }
      )
    }

    const videoData = data.data

    // Extract video information
    const result = {
      id: videoId,
      url: `https://www.bilibili.com/video/${videoId}`,
      title: videoData.title,
      duration: videoData.duration,
      cid: videoData.cid.toString(),
      embedUrl: `https://player.bilibili.com/player.html?bvid=${videoId}&cid=${videoData.cid}`,
      loadedAt: new Date().toISOString(),
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching video metadata:', error)

    return NextResponse.json(
      {
        error: {
          code: 'FETCH_FAILED',
          message: '获取视频信息失败',
          details: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    )
  }
}

