// app/api/bilibili/subtitles/route.ts
// API route for fetching Bilibili subtitle data

import { NextRequest, NextResponse } from 'next/server'
import { parseSubtitles, isValidSubtitleData } from '@/services/subtitleParser'

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get('videoId')
  const cid = request.nextUrl.searchParams.get('cid')
  const lang = request.nextUrl.searchParams.get('lang') || 'zh-CN'

  if (!videoId || !cid) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_PARAMS',
          message: '缺少必要参数：videoId 或 cid',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 400 }
    )
  }

  try {
    // Step 1: Fetch subtitle track list from Bilibili player API
    const playerApiUrl = videoId.startsWith('BV')
      ? `https://api.bilibili.com/x/player/v2?bvid=${videoId}&cid=${cid}`
      : `https://api.bilibili.com/x/player/v2?aid=${videoId.substring(2)}&cid=${cid}`

    const playerResponse = await fetch(playerApiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.bilibili.com',
      },
    })

    if (!playerResponse.ok) {
      return NextResponse.json(
        {
          error: {
            code: 'SUBTITLE_FETCH_FAILED',
            message: '获取字幕列表失败',
            details: `HTTP ${playerResponse.status}`,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 500 }
      )
    }

    const playerData = await playerResponse.json()

    if (playerData.code !== 0) {
      return NextResponse.json(
        {
          error: {
            code: 'SUBTITLE_FETCH_FAILED',
            message: '获取字幕列表失败',
            details: `Bilibili API 错误: ${playerData.message || playerData.code}`,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 500 }
      )
    }

    // Extract subtitle tracks
    const subtitleList = playerData.data?.subtitle?.subtitles || []

    if (subtitleList.length === 0) {
      return NextResponse.json(
        {
          error: {
            code: 'NO_SUBTITLES',
            message: '该视频没有字幕',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      )
    }

    // Step 2: Find preferred subtitle track (default to first available)
    let selectedTrack = subtitleList.find((track: any) =>
      track.lan.includes(lang)
    )

    if (!selectedTrack) {
      selectedTrack = subtitleList[0]
    }

    const tracks = subtitleList.map((track: any) => ({
      lang: track.lan,
      langDoc: track.lan_doc,
      url: track.subtitle_url,
    }))

    // Step 3: Fetch subtitle content from selected track
    let subtitleUrl = selectedTrack.subtitle_url

    // Handle protocol-relative URLs
    if (subtitleUrl.startsWith('//')) {
      subtitleUrl = `https:${subtitleUrl}`
    } else if (subtitleUrl.startsWith('/')) {
      subtitleUrl = `https://api.bilibili.com${subtitleUrl}`
    }

    const subtitleResponse = await fetch(subtitleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.bilibili.com',
      },
    })

    if (!subtitleResponse.ok) {
      return NextResponse.json(
        {
          error: {
            code: 'SUBTITLE_FETCH_FAILED',
            message: '获取字幕内容失败',
            details: `HTTP ${subtitleResponse.status}`,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 500 }
      )
    }

    const subtitleData = await subtitleResponse.json()

    // Step 4: Parse subtitle data
    const bodyData = subtitleData.body || []

    if (!isValidSubtitleData(bodyData)) {
      return NextResponse.json(
        {
          error: {
            code: 'SUBTITLE_PARSE_ERROR',
            message: '字幕数据格式错误',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 500 }
      )
    }

    const subtitles = parseSubtitles(bodyData, videoId)

    return NextResponse.json({
      videoId,
      tracks,
      subtitles,
    })
  } catch (error) {
    console.error('Error fetching subtitles:', error)

    return NextResponse.json(
      {
        error: {
          code: 'SUBTITLE_FETCH_FAILED',
          message: '获取字幕失败',
          details: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    )
  }
}

