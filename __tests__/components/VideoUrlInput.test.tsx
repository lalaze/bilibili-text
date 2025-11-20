/**
 * VideoUrlInput Component Test
 * Tests the URL input form component for Bilibili video URLs
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

describe('VideoUrlInput Component', () => {
  let VideoUrlInput: any

  beforeAll(async () => {
    const module = await import('@/components/VideoUrlInput')
    VideoUrlInput = module.default
  })

  const mockOnSubmit = jest.fn()
  const mockOnError = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render input field and submit button', () => {
    render(<VideoUrlInput onSubmit={mockOnSubmit} onError={mockOnError} />)

    expect(
      screen.getByPlaceholderText(/bilibili.*url/i)
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /加载|提交|load/i })).toBeInTheDocument()
  })

  it('should call onSubmit with video ID when valid URL is entered', async () => {
    render(<VideoUrlInput onSubmit={mockOnSubmit} onError={mockOnError} />)

    const input = screen.getByPlaceholderText(/bilibili.*url/i)
    const button = screen.getByRole('button', { name: /加载|提交|load/i })

    const validUrl = 'https://www.bilibili.com/video/BV1xx411c7mD'
    fireEvent.change(input, { target: { value: validUrl } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('BV1xx411c7mD', validUrl)
    })
  })

  it('should call onError when invalid URL is entered', async () => {
    render(<VideoUrlInput onSubmit={mockOnSubmit} onError={mockOnError} />)

    const input = screen.getByPlaceholderText(/bilibili.*url/i)
    const button = screen.getByRole('button', { name: /加载|提交|load/i })

    const invalidUrl = 'https://example.com/video'
    fireEvent.change(input, { target: { value: invalidUrl } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalled()
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  it('should disable submit button during loading', () => {
    render(
      <VideoUrlInput
        onSubmit={mockOnSubmit}
        onError={mockOnError}
        isLoading={true}
      />
    )

    const button = screen.getByRole('button', { name: /加载|提交|load/i })
    expect(button).toBeDisabled()
  })

  it('should clear error when input changes', async () => {
    const { rerender } = render(
      <VideoUrlInput onSubmit={mockOnSubmit} onError={mockOnError} />
    )

    const input = screen.getByPlaceholderText(/bilibili.*url/i)

    // Enter invalid URL
    fireEvent.change(input, { target: { value: 'invalid' } })
    const button = screen.getByRole('button', { name: /加载|提交|load/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalled()
    })

    // Change input - error should be cleared
    fireEvent.change(input, {
      target: { value: 'https://www.bilibili.com/video/BV1xx411c7mD' },
    })

    // Error message should no longer be displayed
    const errorMessages = screen.queryAllByRole('alert')
    expect(errorMessages.length).toBe(0)
  })

  it('should support Enter key submission', async () => {
    render(<VideoUrlInput onSubmit={mockOnSubmit} onError={mockOnError} />)

    const input = screen.getByPlaceholderText(/bilibili.*url/i)
    const validUrl = 'https://www.bilibili.com/video/BV1xx411c7mD'

    fireEvent.change(input, { target: { value: validUrl } })
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 })

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('BV1xx411c7mD', validUrl)
    })
  })

  it('should have proper accessibility attributes', () => {
    render(<VideoUrlInput onSubmit={mockOnSubmit} onError={mockOnError} />)

    const input = screen.getByPlaceholderText(/bilibili.*url/i)

    expect(input).toHaveAttribute('type', 'url')
    expect(input).toHaveAttribute('required')
    expect(input).toHaveAttribute('aria-label')
  })

  it('should validate BV format URLs', async () => {
    render(<VideoUrlInput onSubmit={mockOnSubmit} onError={mockOnError} />)

    const input = screen.getByPlaceholderText(/bilibili.*url/i)
    const button = screen.getByRole('button', { name: /加载|提交|load/i })

    const bvUrl = 'https://www.bilibili.com/video/BV1xx411c7mD'
    fireEvent.change(input, { target: { value: bvUrl } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('BV1xx411c7mD', bvUrl)
    })
  })

  it('should validate av format URLs', async () => {
    render(<VideoUrlInput onSubmit={mockOnSubmit} onError={mockOnError} />)

    const input = screen.getByPlaceholderText(/bilibili.*url/i)
    const button = screen.getByRole('button', { name: /加载|提交|load/i })

    const avUrl = 'https://www.bilibili.com/video/av12345'
    fireEvent.change(input, { target: { value: avUrl } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('av12345', avUrl)
    })
  })
})

