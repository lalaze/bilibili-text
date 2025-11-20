/**
 * Video Loading Integration Test (E2E)
 * Tests the complete video loading flow from URL input to video display
 */

import { test, expect } from '@playwright/test'

test.describe('Video Loading Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load video and display subtitles when valid URL is entered', async ({
    page,
  }) => {
    // Enter a valid Bilibili URL
    const urlInput = page.getByPlaceholder(/bilibili.*url/i)
    await urlInput.fill('https://www.bilibili.com/video/BV1xx411c7mD')

    // Click submit button
    const submitButton = page.getByRole('button', { name: /加载|提交|load/i })
    await submitButton.click()

    // Wait for navigation to video page
    await page.waitForURL(/\/video\//)

    // Check if video player is loaded
    const videoPlayer = page.frameLocator('iframe[title*="video" i]')
    await expect(videoPlayer.locator('body')).toBeVisible()

    // Check if subtitles are displayed
    const subtitleDisplay = page.getByRole('region', { name: /subtitles|字幕/i })
    await expect(subtitleDisplay).toBeVisible()

    // Check if at least one subtitle segment is visible
    const subtitleSegments = page.getByRole('button').filter({
      has: page.locator('text=/subtitle|字幕/i'),
    })
    await expect(subtitleSegments.first()).toBeVisible()
  })

  test('should show error message for invalid URL', async ({ page }) => {
    const urlInput = page.getByPlaceholder(/bilibili.*url/i)
    await urlInput.fill('https://example.com/invalid')

    const submitButton = page.getByRole('button', { name: /加载|提交|load/i })
    await submitButton.click()

    // Error message should be displayed
    const errorMessage = page.getByRole('alert')
    await expect(errorMessage).toBeVisible()
    await expect(errorMessage).toContainText(/invalid|无效/i)
  })

  test('should show loading state during video fetch', async ({ page }) => {
    const urlInput = page.getByPlaceholder(/bilibili.*url/i)
    await urlInput.fill('https://www.bilibili.com/video/BV1xx411c7mD')

    const submitButton = page.getByRole('button', { name: /加载|提交|load/i })
    await submitButton.click()

    // Loading indicator should be visible
    const loadingIndicator = page.getByText(/loading|加载中/i)
    await expect(loadingIndicator).toBeVisible({ timeout: 1000 })
  })

  test('should handle video not found error', async ({ page }) => {
    // Mock API to return 404
    await page.route('**/api/bilibili/video**', (route) => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'VIDEO_NOT_FOUND',
            message: 'Video not found',
          },
        }),
      })
    })

    const urlInput = page.getByPlaceholder(/bilibili.*url/i)
    await urlInput.fill('https://www.bilibili.com/video/BV_notfound')

    const submitButton = page.getByRole('button', { name: /加载|提交|load/i })
    await submitButton.click()

    // Error message should be displayed
    const errorMessage = page.getByRole('alert')
    await expect(errorMessage).toBeVisible()
    await expect(errorMessage).toContainText(/not found|不存在/i)
  })

  test('should handle no subtitles error', async ({ page }) => {
    // Mock API to return video but no subtitles
    await page.route('**/api/bilibili/subtitles**', (route) => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'NO_SUBTITLES',
            message: 'No subtitles available',
          },
        }),
      })
    })

    const urlInput = page.getByPlaceholder(/bilibili.*url/i)
    await urlInput.fill('https://www.bilibili.com/video/BV1xx411c7mD')

    const submitButton = page.getByRole('button', { name: /加载|提交|load/i })
    await submitButton.click()

    await page.waitForURL(/\/video\//)

    // Error or info message about no subtitles
    const message = page.getByRole('alert')
    await expect(message).toBeVisible()
    await expect(message).toContainText(/no subtitles|没有字幕/i)
  })

  test('should support both BV and av format URLs', async ({ page }) => {
    // Test BV format
    const urlInput = page.getByPlaceholder(/bilibili.*url/i)
    await urlInput.fill('https://www.bilibili.com/video/BV1xx411c7mD')

    let submitButton = page.getByRole('button', { name: /加载|提交|load/i })
    await submitButton.click()

    await page.waitForURL(/\/video\/BV/)

    // Navigate back
    await page.goto('/')

    // Test av format
    await urlInput.fill('https://www.bilibili.com/video/av12345')
    submitButton = page.getByRole('button', { name: /加载|提交|load/i })
    await submitButton.click()

    await page.waitForURL(/\/video\/av/)
  })

  test('should clear error when input changes', async ({ page }) => {
    // Enter invalid URL
    const urlInput = page.getByPlaceholder(/bilibili.*url/i)
    await urlInput.fill('https://example.com/invalid')

    const submitButton = page.getByRole('button', { name: /加载|提交|load/i })
    await submitButton.click()

    // Error should be visible
    let errorMessage = page.getByRole('alert')
    await expect(errorMessage).toBeVisible()

    // Change input
    await urlInput.clear()
    await urlInput.fill('https://www.bilibili.com/video/BV1xx411c7mD')

    // Error should be cleared
    await expect(errorMessage).not.toBeVisible()
  })

  test('should support keyboard navigation', async ({ page }) => {
    const urlInput = page.getByPlaceholder(/bilibili.*url/i)
    await urlInput.fill('https://www.bilibili.com/video/BV1xx411c7mD')

    // Press Enter to submit
    await urlInput.press('Enter')

    await page.waitForURL(/\/video\//)
  })

  test('should have proper page title', async ({ page }) => {
    await expect(page).toHaveTitle(/bilibili|字幕/i)
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    const urlInput = page.getByPlaceholder(/bilibili.*url/i)
    await expect(urlInput).toBeVisible()

    const submitButton = page.getByRole('button', { name: /加载|提交|load/i })
    await expect(submitButton).toBeVisible()
  })
})

