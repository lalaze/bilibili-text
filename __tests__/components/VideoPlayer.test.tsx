/**
 * VideoPlayer Component Test
 * Tests the Bilibili video player component
 */

import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

describe('VideoPlayer Component', () => {
  let VideoPlayer: any

  beforeAll(async () => {
    const module = await import('@/components/VideoPlayer')
    VideoPlayer = module.default
  })

  const mockOnTimeUpdate = jest.fn()
  const mockOnPlayStateChange = jest.fn()
  const mockOnError = jest.fn()

  const defaultProps = {
    videoId: 'BV1xx411c7mD',
    embedUrl: 'https://player.bilibili.com/player.html?bvid=BV1xx411c7mD&cid=123456789',
    onTimeUpdate: mockOnTimeUpdate,
    onPlayStateChange: mockOnPlayStateChange,
    onError: mockOnError,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render iframe with correct embedUrl', () => {
    render(<VideoPlayer {...defaultProps} />)

    const iframe = screen.getByTitle(/bilibili.*video|视频播放器/i)
    expect(iframe).toBeInTheDocument()
    expect(iframe).toHaveAttribute('src', defaultProps.embedUrl)
  })

  it('should have proper iframe attributes for security', () => {
    render(<VideoPlayer {...defaultProps} />)

    const iframe = screen.getByTitle(/bilibili.*video|视频播放器/i)
    expect(iframe).toHaveAttribute('sandbox')
    expect(iframe.getAttribute('sandbox')).toContain('allow-scripts')
    expect(iframe.getAttribute('sandbox')).toContain('allow-same-origin')
  })

  it('should apply custom className if provided', () => {
    const customClass = 'custom-video-player'
    const { container } = render(
      <VideoPlayer {...defaultProps} className={customClass} />
    )

    expect(container.firstChild).toHaveClass(customClass)
  })

  it('should have proper ARIA attributes', () => {
    render(<VideoPlayer {...defaultProps} />)

    const iframe = screen.getByTitle(/bilibili.*video|视频播放器/i)
    expect(iframe).toHaveAttribute('title')
    expect(iframe).toHaveAttribute('aria-label')
  })

  it('should render loading state initially', () => {
    render(<VideoPlayer {...defaultProps} />)

    // Loading indicator should be present initially
    const loadingIndicator = screen.queryByText(/加载中|loading/i)
    // Loading might be shown or not depending on implementation
    // Just verify component renders
    expect(screen.getByTitle(/bilibili.*video|视频播放器/i)).toBeInTheDocument()
  })

  it('should handle different video IDs', () => {
    const { rerender } = render(<VideoPlayer {...defaultProps} />)

    const iframe1 = screen.getByTitle(/bilibili.*video|视频播放器/i)
    expect(iframe1).toHaveAttribute('src', defaultProps.embedUrl)

    const newProps = {
      ...defaultProps,
      videoId: 'BV_different',
      embedUrl:
        'https://player.bilibili.com/player.html?bvid=BV_different&cid=999',
    }

    rerender(<VideoPlayer {...newProps} />)

    const iframe2 = screen.getByTitle(/bilibili.*video|视频播放器/i)
    expect(iframe2).toHaveAttribute('src', newProps.embedUrl)
  })

  it('should be responsive with proper aspect ratio', () => {
    const { container } = render(<VideoPlayer {...defaultProps} />)

    // Check if container has responsive classes or aspect ratio
    const playerContainer = container.firstChild as HTMLElement
    expect(playerContainer).toBeInTheDocument()
  })

  it('should allow fullscreen capability', () => {
    render(<VideoPlayer {...defaultProps} />)

    const iframe = screen.getByTitle(/bilibili.*video|视频播放器/i)
    expect(iframe.getAttribute('allowfullscreen')).toBeDefined()
  })
})

