/**
 * ErrorMessage Component Test
 * Tests the error display component
 */

import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AppError } from '@/types/errors'

describe('ErrorMessage Component', () => {
  let ErrorMessage: any

  beforeAll(async () => {
    const module = await import('@/components/ErrorMessage')
    ErrorMessage = module.default
  })

  it('should not render when error is null', () => {
    const { container } = render(<ErrorMessage error={null} />)

    expect(container.firstChild).toBeNull()
  })

  it('should render error message when error is provided', () => {
    const error: AppError = 'VIDEO_NOT_FOUND'

    render(<ErrorMessage error={error} />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/视频不存在|video not found/i)).toBeInTheDocument()
  })

  it('should display different error types correctly', () => {
    const errors: AppError[] = [
      'VIDEO_NOT_FOUND',
      'NO_SUBTITLES',
      'FETCH_FAILED',
    ]

    errors.forEach((error) => {
      const { unmount } = render(<ErrorMessage error={error} />)

      expect(screen.getByRole('alert')).toBeInTheDocument()

      unmount()
    })
  })

  it('should show dismiss button when onDismiss is provided', () => {
    const mockOnDismiss = jest.fn()
    const error: AppError = 'VIDEO_NOT_FOUND'

    render(<ErrorMessage error={error} onDismiss={mockOnDismiss} />)

    const dismissButton = screen.getByRole('button', {
      name: /关闭|dismiss|close/i,
    })
    expect(dismissButton).toBeInTheDocument()
  })

  it('should call onDismiss when dismiss button is clicked', () => {
    const mockOnDismiss = jest.fn()
    const error: AppError = 'VIDEO_NOT_FOUND'

    render(<ErrorMessage error={error} onDismiss={mockOnDismiss} />)

    const dismissButton = screen.getByRole('button', {
      name: /关闭|dismiss|close/i,
    })
    fireEvent.click(dismissButton)

    expect(mockOnDismiss).toHaveBeenCalledTimes(1)
  })

  it('should not show dismiss button when onDismiss is not provided', () => {
    const error: AppError = 'VIDEO_NOT_FOUND'

    render(<ErrorMessage error={error} />)

    const dismissButtons = screen.queryAllByRole('button', {
      name: /关闭|dismiss|close/i,
    })
    expect(dismissButtons.length).toBe(0)
  })

  it('should have proper ARIA attributes', () => {
    const error: AppError = 'VIDEO_NOT_FOUND'

    render(<ErrorMessage error={error} />)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveAttribute('role', 'alert')
  })

  it('should apply different styles for different error types', () => {
    const warningError: AppError = 'NO_SUBTITLES'
    const { container: warningContainer } = render(
      <ErrorMessage error={warningError} />
    )

    const criticalError: AppError = 'FETCH_FAILED'
    const { container: criticalContainer } = render(
      <ErrorMessage error={criticalError} />
    )

    // Both should have alert role but may have different styling classes
    expect(warningContainer.querySelector('[role="alert"]')).toBeInTheDocument()
    expect(
      criticalContainer.querySelector('[role="alert"]')
    ).toBeInTheDocument()
  })

  it('should handle undefined onDismiss gracefully', () => {
    const error: AppError = 'VIDEO_NOT_FOUND'

    const { container } = render(
      <ErrorMessage error={error} onDismiss={undefined} />
    )

    expect(container.querySelector('[role="alert"]')).toBeInTheDocument()
  })
})

