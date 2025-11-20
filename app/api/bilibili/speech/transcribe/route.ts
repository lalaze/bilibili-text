// app/api/bilibili/speech/transcribe/route.ts
// Transcribe video audio using OpenAI Whisper API

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { promisify } from 'util'
import { pipeline } from 'stream'

const streamPipeline = promisify(pipeline)

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL, // Optional: custom API endpoint
})

// Configuration from environment variables
const MAX_VIDEO_DURATION = parseInt(
  process.env.MAX_VIDEO_DURATION || '7200',
  10
) // 2 hours
// const MAX_AUDIO_SIZE = parseInt(
//   process.env.MAX_AUDIO_SIZE || '26214400',
//   10
// ) // 25MB

interface SubtitleSegment {
  id: string
  videoId: string
  startTime: number
  endTime: number
  text: string
  index: number
  language: string
}

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null

  try {
    const body = await request.json()
    const { videoId, language = 'zh' } = body

    // Note: audioUrl is no longer required as we fetch it server-side
    if (!videoId) {
      return NextResponse.json(
        {
          error: 'INVALID_PARAMS',
          message: 'videoId is required',
        },
        { status: 400 }
      )
    }

    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: 'API_ERROR',
          message: 'OpenAI API key not configured. Please set OPENAI_API_KEY in .env.local',
          details: 'Refer to OPENAI_BASEURL_CONFIG.md for configuration instructions',
        },
        { status: 500 }
      )
    }

    // 1. Extract/Download audio from Bilibili
    console.log(`Downloading audio for video ${videoId}...`)
    tempFilePath = await downloadBilibiliAudio(videoId)

    // Check file size
    const stats = fs.statSync(tempFilePath)
    const fileSizeInBytes = stats.size
    const fileSizeInMB = fileSizeInBytes / (1024 * 1024)
    console.log(`Audio file size: ${fileSizeInMB.toFixed(2)}MB`)

    if (fileSizeInMB > 25) {
       throw new Error(`Audio file too large (${fileSizeInMB.toFixed(2)}MB). Max allowed by OpenAI is 25MB. Please use a shorter video.`)
    }
    
    // 2. Transcribe with Whisper API
    console.log(`Transcribing audio file: ${tempFilePath}`)
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: 'whisper-1',
      language,
      response_format: 'verbose_json',
      timestamp_granularities: ['segment']
    })

    console.log('Transcription completed')

    // 3. Parse response
    const subtitles = parseWhisperResponse(transcription, videoId, language)

    return NextResponse.json({ subtitles })

  } catch (error) {
    console.error('Transcription error:', error)

    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        {
          error: 'API_ERROR',
          message: error.message,
        },
        { status: error.status || 500 }
      )
    }

    return NextResponse.json(
      {
        error: 'TRANSCRIPTION_FAILED',
        message: 'Failed to transcribe audio',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  } finally {
    // Cleanup temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath)
        console.log(`Cleaned up temp file: ${tempFilePath}`)
      } catch (e) {
        console.error('Failed to cleanup temp file:', e)
      }
    }
  }
}

/**
 * Helper function to fetch audio from Bilibili
 */
async function downloadBilibiliAudio(videoId: string): Promise<string> {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.bilibili.com',
  }

  // 1. Get CID
  const viewApiUrl = videoId.startsWith('BV')
    ? `https://api.bilibili.com/x/web-interface/view?bvid=${videoId}`
    : `https://api.bilibili.com/x/web-interface/view?aid=${videoId.substring(2)}`
  
  const viewResp = await fetch(viewApiUrl, { headers })
  if (!viewResp.ok) throw new Error(`Failed to fetch video info: ${viewResp.status}`)
  const viewData = await viewResp.json()
  if (viewData.code !== 0) throw new Error(`Bilibili API error: ${viewData.message}`)
  
  const cid = viewData.data.cid
  const duration = viewData.data.duration
  
  if (duration > MAX_VIDEO_DURATION) {
    throw new Error(`Video too long (duration: ${duration}s). Max allowed: ${MAX_VIDEO_DURATION}s`)
  }

  // 2. Get Play URL (Audio stream)
  // fnval=16 requests DASH format which separates audio/video
  const playUrlApi = `https://api.bilibili.com/x/player/playurl?bvid=${videoId}&cid=${cid}&fnval=16`
  const playResp = await fetch(playUrlApi, { headers })
  if (!playResp.ok) throw new Error(`Failed to fetch play url: ${playResp.status}`)
  const playData = await playResp.json()
  if (playData.code !== 0) throw new Error(`Bilibili PlayURL error: ${playData.message}`)

  let audioUrl: string | undefined

  if (playData.data.dash && playData.data.dash.audio && playData.data.dash.audio.length > 0) {
    // Pick the first audio stream (usually best quality)
    audioUrl = playData.data.dash.audio[0].baseUrl
  } else if (playData.data.durl && playData.data.durl.length > 0) {
    // Fallback to flv/mp4 url (might contain video, but Whisper handles it)
    audioUrl = playData.data.durl[0].url
  }

  if (!audioUrl) {
    throw new Error('No audio stream found')
  }

  // 3. Download Audio Stream
  const tempDir = os.tmpdir()
  const tempFile = path.join(tempDir, `bili_${videoId}_${Date.now()}.m4a`) // Use .m4a extension for DASH audio

  const audioResp = await fetch(audioUrl, { headers })
  if (!audioResp.ok) throw new Error(`Failed to download audio stream: ${audioResp.status}`)
  
  if (!audioResp.body) throw new Error('Audio response has no body')

  // Use type assertion for web streams to node streams pipeline
  // @ts-ignore - fetch body is web stream, pipeline supports it in recent node versions but types might mismatch
  await streamPipeline(audioResp.body, fs.createWriteStream(tempFile))

  return tempFile
}

/**
 * Helper function to parse Whisper response into SubtitleSegment[]
 */
function parseWhisperResponse(
  transcription: any,
  videoId: string,
  language: string
): SubtitleSegment[] {
  if (!transcription.segments) {
    return []
  }

  return transcription.segments.map((segment: any, index: number) => ({
    id: `subtitle-${index}`,
    videoId,
    startTime: segment.start,
    endTime: segment.end,
    text: segment.text.trim(),
    index,
    language,
  }))
}
