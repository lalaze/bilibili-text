/**
 * SubtitleDisplay Component Test
 * Tests the subtitle list display component
 */

import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SubtitleSegment } from '@/types/subtitle'

describe('SubtitleDisplay Component', () => {
  let SubtitleDisplay: any

  beforeAll(async () => {
    const module = await import('@/components/SubtitleDisplay')
    SubtitleDisplay = module.default
  })

  const mockOnSegmentClick = jest.fn()

  const mockSubtitles: SubtitleSegment[] = [
    {
      id: 'subtitle-0',
      videoId: 'BV1xx411c7mD',
      startTime: 0,
      endTime: 2.5,
      text: 'First subtitle',
      index: 0,
    },
    {
      id: 'subtitle-1',
      videoId: 'BV1xx411c7mD',
      startTime: 2.5,
      endTime: 5.0,
      text: 'Second subtitle',
      index: 1,
    },
    {
      id: 'subtitle-2',
      videoId: 'BV1xx411c7mD',
      startTime: 5.0,
      endTime: 7.5,
      text: 'Third subtitle',
      index: 2,
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render all subtitle segments', () => {
    render(
      <SubtitleDisplay
        subtitles={mockSubtitles}
        activeSegmentId={null}
        highlightedSegmentIds={new Set()}
        onSegmentClick={mockOnSegmentClick}
      />
    )

    expect(screen.getByText('First subtitle')).toBeInTheDocument()
    expect(screen.getByText('Second subtitle')).toBeInTheDocument()
    expect(screen.getByText('Third subtitle')).toBeInTheDocument()
  })

  it('should render empty state when no subtitles', () => {
    render(
      <SubtitleDisplay
        subtitles={[]}
        activeSegmentId={null}
        highlightedSegmentIds={new Set()}
        onSegmentClick={mockOnSegmentClick}
      />
    )

    expect(screen.getByText(/no subtitles|没有字幕/i)).toBeInTheDocument()
  })

  it('should highlight active segment', () => {
    const { container } = render(
      <SubtitleDisplay
        subtitles={mockSubtitles}
        activeSegmentId="subtitle-1"
        highlightedSegmentIds={new Set()}
        onSegmentClick={mockOnSegmentClick}
      />
    )

    // Find the active segment (Second subtitle)
    const activeSegment = screen.getByText('Second subtitle').closest('div')
    expect(activeSegment).toHaveClass(/active|subtitle-segment--active/)
  })

  it('should show highlighted segments with distinct styling', () => {
    const highlightedIds = new Set(['subtitle-0', 'subtitle-2'])

    const { container } = render(
      <SubtitleDisplay
        subtitles={mockSubtitles}
        activeSegmentId={null}
        highlightedSegmentIds={highlightedIds}
        onSegmentClick={mockOnSegmentClick}
      />
    )

    const firstSegment = screen.getByText('First subtitle').closest('div')
    const thirdSegment = screen.getByText('Third subtitle').closest('div')

    expect(firstSegment).toHaveClass(/highlighted|subtitle-segment--highlighted/)
    expect(thirdSegment).toHaveClass(/highlighted|subtitle-segment--highlighted/)
  })

  it('should call onSegmentClick when segment is clicked', () => {
    render(
      <SubtitleDisplay
        subtitles={mockSubtitles}
        activeSegmentId={null}
        highlightedSegmentIds={new Set()}
        onSegmentClick={mockOnSegmentClick}
      />
    )

    const firstSegment = screen.getByText('First subtitle')
    fireEvent.click(firstSegment)

    expect(mockOnSegmentClick).toHaveBeenCalledWith('subtitle-0')
  })

  it('should support keyboard navigation', () => {
    render(
      <SubtitleDisplay
        subtitles={mockSubtitles}
        activeSegmentId={null}
        highlightedSegmentIds={new Set()}
        onSegmentClick={mockOnSegmentClick}
      />
    )

    const segments = screen.getAllByRole('button')
    expect(segments.length).toBeGreaterThan(0)

    segments.forEach((segment) => {
      expect(segment).toHaveAttribute('tabIndex')
    })
  })

  it('should have proper ARIA attributes', () => {
    render(
      <SubtitleDisplay
        subtitles={mockSubtitles}
        activeSegmentId="subtitle-1"
        highlightedSegmentIds={new Set()}
        onSegmentClick={mockOnSegmentClick}
      />
    )

    const container = screen.getByRole('region', { name: /subtitles|字幕/i })
    expect(container).toBeInTheDocument()

    // Active segment should have aria-current
    const activeSegment = screen.getByText('Second subtitle').closest('[role="button"]')
    expect(activeSegment).toHaveAttribute('aria-current', 'true')
  })

  it('should display timing information for each segment', () => {
    render(
      <SubtitleDisplay
        subtitles={mockSubtitles}
        activeSegmentId={null}
        highlightedSegmentIds={new Set()}
        onSegmentClick={mockOnSegmentClick}
      />
    )

    // Check for formatted time display (0:00, 0:02, etc.)
    expect(screen.getByText(/0:00/)).toBeInTheDocument()
  })

  it('should handle large number of subtitles with virtualization', () => {
    const largeSubtitleList: SubtitleSegment[] = Array.from(
      { length: 1000 },
      (_, i) => ({
        id: `subtitle-${i}`,
        videoId: 'BV1xx411c7mD',
        startTime: i * 2,
        endTime: (i + 1) * 2,
        text: `Subtitle ${i}`,
        index: i,
      })
    )

    const { container } = render(
      <SubtitleDisplay
        subtitles={largeSubtitleList}
        activeSegmentId={null}
        highlightedSegmentIds={new Set()}
        onSegmentClick={mockOnSegmentClick}
      />
    )

    // Component should render without crashing
    expect(container).toBeInTheDocument()

    // Should use virtualization for large lists
    // Not all 1000 items should be in DOM
    const renderedItems = screen.queryAllByRole('button')
    expect(renderedItems.length).toBeLessThan(1000)
  })

  it('should apply custom className if provided', () => {
    const customClass = 'custom-subtitle-display'
    const { container } = render(
      <SubtitleDisplay
        subtitles={mockSubtitles}
        activeSegmentId={null}
        highlightedSegmentIds={new Set()}
        onSegmentClick={mockOnSegmentClick}
        className={customClass}
      />
    )

    expect(container.firstChild).toHaveClass(customClass)
  })
})

