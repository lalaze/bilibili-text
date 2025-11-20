// __tests__/components/SpeechRecognitionStatus.test.tsx
// Unit tests for SpeechRecognitionStatus component

import React from 'react'
import { render, screen } from '@testing-library/react'
import SpeechRecognitionStatus from '@/components/SpeechRecognitionStatus'

describe('SpeechRecognitionStatus', () => {
  it('should render pending status', () => {
    render(<SpeechRecognitionStatus status="pending" progress={0} />)

    expect(screen.getByText('准备开始语音识别...')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '0'
    )
  })

  it('should render processing status with progress', () => {
    render(<SpeechRecognitionStatus status="processing" progress={50} />)

    expect(screen.getByText('正在生成字幕...')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '50'
    )
  })

  it('should render completed status', () => {
    render(<SpeechRecognitionStatus status="completed" progress={100} />)

    expect(screen.getByText('字幕生成完成')).toBeInTheDocument()
    expect(screen.getByText('字幕已缓存，下次加载将更快')).toBeInTheDocument()
  })

  it('should render failed status with error', () => {
    const errorMessage = 'API调用失败'

    render(
      <SpeechRecognitionStatus
        status="failed"
        progress={0}
        error={errorMessage}
      />
    )

    expect(screen.getByText('字幕生成失败')).toBeInTheDocument()
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(errorMessage)
  })

  it('should have proper ARIA attributes', () => {
    render(<SpeechRecognitionStatus status="processing" progress={75} />)

    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')

    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-valuemin', '0')
    expect(progressbar).toHaveAttribute('aria-valuemax', '100')
    expect(progressbar).toHaveAttribute('aria-valuenow', '75')
  })

  it('should show helper text for processing status', () => {
    render(<SpeechRecognitionStatus status="processing" progress={30} />)

    expect(
      screen.getByText('这可能需要几分钟时间，取决于视频长度')
    ).toBeInTheDocument()
  })
})

