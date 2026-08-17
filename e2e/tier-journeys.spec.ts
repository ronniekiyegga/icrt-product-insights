import { expect, test, type Page } from '@playwright/test'

async function selectTier(page: Page, tier: 'premium' | 'enterprise') {
  await page.getByRole('button', { name: /Viewing as basic, Alex Johnson/i }).click()
  await page.getByRole('button', { name: tier, exact: true }).click()
}

test('Basic keeps product identifiers out of the DOM', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByText('Unlock product-level insights')).toBeVisible()
  await expect(page.locator('body')).not.toContainText(/BrandA|BrandB|BrandC|DW-100|DW-200|DW-300/)
})

test('Premium keeps report export focusable without downloading', async ({ page }) => {
  await page.goto('/')
  await selectTier(page, 'premium')

  const exportButton = page.getByRole('button', { name: 'Download PDF Report' })
  await expect(exportButton).toBeVisible()
  await expect(exportButton).toHaveAttribute('aria-disabled', 'true')

  await exportButton.focus()
  await expect(exportButton).toBeFocused()

  const download = page.waitForEvent('download', { timeout: 750 }).then(
    () => true,
    () => false,
  )
  await exportButton.click()

  expect(await download).toBe(false)
  await expect(page.getByText('Report export requires Enterprise access')).toBeVisible()
})

test('Enterprise downloads the PDF report', async ({ page }) => {
  await page.goto('/')
  await selectTier(page, 'enterprise')

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download PDF Report' }).click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toBe('dishwashers-product-report.pdf')
})
