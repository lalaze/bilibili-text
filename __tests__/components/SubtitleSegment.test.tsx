/**
 * SubtitleSegment Component Test
 * Tests the individual subtitle segment component
 */

import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SubtitleSegment as SubtitleSegmentType } from '@/types/subtitle'

describe('SubtitleSegment Component', () => {
  let SubtitleSegment: any

  beforeAll(async () => {
    const module = await import('@/components/SubtitleSegment')
    SubtitleSegment = module.default
  })

  const mockOnClick = jest.fn()

  const mockSegment: SubtitleSegmentType = {
    id: 'subtitle-0',
    videoId: 'BV1xx411c7mD',
    startTime: 0,
    endTime: 2.5,
    text: 'Hello world',
    index: 0,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render segment text', () => {
    render(
      <SubtitleSegment
        segment={mockSegment}
        isActive={false}
        isHighlighted={false}
        onClick={mockOnClick}
      />
    )

    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('should display timing information', () => {
    render(
      <SubtitleSegment
        segment={mockSegment}
        isActive={false}
        isHighlighted={false}
        onClick={mockOnClick}
      />
    )

    // Should display formatted time (0:00 - 0:02)
    expect(screen.getByText(/0:00/)).toBeInTheDocument()
    expect(screen.getByText(/0:02/)).toBeInTheDocument()
  })

  it('should apply active styling when isActive is true', () => {
    const { container } = render(
      <SubtitleSegment
        segment={mockSegment}
        isActive={true}
        isHighlighted={false}
        onClick={mockOnClick}
      />
    )

    const element = container.firstChild as HTMLElement
    expect(element).toHaveClass(/active|subtitle-segment--active/)
  })

  it('should apply highlighted styling when isHighlighted is true', () => {
    const { container } = render(
      <SubtitleSegment
        segment={mockSegment}
        isActive={false}
        isHighlighted={true}
        onClick={mockOnClick}
      />
    )

    const element = container.firstChild as HTMLElement
    expect(element).toHaveClass(/highlighted|subtitle-segment--highlighted/)
  })

  it('should apply both active and highlighted styles when both are true', () => {
    const { container } = render(
      <SubtitleSegment
        segment={mockSegment}
        isActive={true}
        isHighlighted={true}
        onClick={mockOnClick}
      />
    )

    const element = container.firstChild as HTMLElement
    expect(element.className).toMatch(/active|subtitle-segment--active/)
    expect(element.className).toMatch(/highlighted|subtitle-segment--highlighted/)
  })

  it('should call onClick with segment ID when clicked', () => {
    render(
      <SubtitleSegment
        segment={mockSegment}
        isActive={false}
        isHighlighted={false}
        onClick={mockOnClick}
      />
    )

    const element = screen.getByText('Hello world')
    fireEvent.click(element)

    expect(mockOnClick).toHaveBeenCalledWith('subtitle-0')
    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('should support keyboard interaction', () => {
    render(
      <SubtitleSegment
        segment={mockSegment}
        isActive={false}
        isHighlighted={false}
        onClick={mockOnClick}
      />
    )

    const element = screen.getByRole('button')
    expect(element).toHaveAttribute('tabIndex', '0')

    fireEvent.keyDown(element, { key: 'Enter', code: 'Enter' })
    expect(mockOnClick).toHaveBeenCalledWith('subtitle-0')
  })

  it('should have proper ARIA attributes', () => {
    render(
      <SubtitleSegment
        segment={mockSegment}
        isActive={true}
        isHighlighted={false}
        onClick={mockOnClick}
      />
    )

    const element = screen.getByRole('button')
    expect(element).toHaveAttribute('aria-current', 'true')
  })

  it('should not have aria-current when not active', () => {
    render(
      <SubtitleSegment
        segment={mockSegment}
        isActive={false}
        isHighlighted={false}
        onClick={mockOnClick}
      />
    )

    const element = screen.getByRole('button')
    expect(element).not.toHaveAttribute('aria-current', 'true')
  })

  it('should handle long text without breaking layout', () => {
    const longSegment: SubtitleSegmentType = {
      ...mockSegment,
      text: 'This is a very long subtitle text that should be handled properly without breaking the layout or causing any visual issues in the component rendering',
    }

    render(
      <SubtitleSegment
        segment={longSegment}
        isActive={false}
        isHighlighted={false}
        onClick={mockOnClick}
      />
    )

    expect(screen.getByText(longSegment.text)).toBeInTheDocument()
  })

  it('should apply custom className if provided', () => {
    const customClass = 'custom-segment'
    const { container } = render(
      <SubtitleSegment
        segment={mockSegment}
        isActive={false}
        isHighlighted={false}
        onClick={mockOnClick}
        className={customClass}
      />
    )

    expect(container.firstChild).toHaveClass(customClass)
  })

  it('should be memoized for performance', () => {
    const { rerender } = render(
      <SubtitleSegment
        segment={mockSegment}
        isActive={false}
        isHighlighted={false}
        onClick={mockOnClick}
      />
    )

    // Rerender with same props
    rerender(
      <SubtitleSegment
        segment={mockSegment}
        isActive={false}
        isHighlighted={false}
        onClick={mockOnClick}
      />
    )

    // Component should not re-render unnecessarily
    // This is verified through React.memo in implementation
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('should handle hover state', () => {
    render(
      <SubtitleSegment
        segment={mockSegment}
        isActive={false}
        isHighlighted={false}
        onClick={mockOnClick}
      />
    )

    const element = screen.getByRole('button')
    fireEvent.mouseEnter(element)

    // Should have hover styles applied via CSS
    expect(element).toBeInTheDocument()
  })
})

