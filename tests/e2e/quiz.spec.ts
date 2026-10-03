import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.describe('single choice', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/')
    await expect(page.locator('[data-quiz="single"]')).toBeVisible()
  })

  test('shows two statements and five answers', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Implications Trainer' })).toBeVisible()
    await expect(page.locator('.statement')).toHaveCount(2)
    await expect(page.locator('button.option-button')).toHaveCount(5)
  })

  test('marks the correct answer with text, not only color', async ({ page }) => {
    await page.locator('button.option-button').first().click()

    await expect(page.locator('[data-status="correct"]')).toHaveCount(1)
    await expect(page.locator('[data-status="correct"] .option-status')).toHaveText('Correct')
    await expect(page.locator('button.option-button[aria-disabled="true"]')).toHaveCount(5)
  })

  test('shows a new question', async ({ page }) => {
    const before = await page.locator('.statement-text').allTextContents()

    for (let attempt = 0; attempt < 5; attempt++) {
      await page.getByRole('link', { name: /New Question/ }).click()
      await expect(page.locator('[data-quiz="single"]')).toBeVisible()

      if ((await page.locator('.statement-text').allTextContents()).join() !== before.join()) {
        return
      }
    }

    throw new Error('The question never changed')
  })
})

test.describe('multiple choice', () => {
  test('lets you check your answers', async ({ page }) => {
    await page.goto('/en/multi-choice')
    await expect(page.locator('[data-quiz="multi"]')).toBeVisible()

    await page.locator('label.option-checkbox').first().click()
    await page.getByRole('button', { name: /Check Answers/ }).click()

    await expect(page.locator('[data-status="correct"]').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Check Answers/ })).toBeDisabled()
  })
})

test('redirects the root to English', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL(/\/en\/$/)
})

test('switches to German and keeps the quiz mode', async ({ page }) => {
  await page.goto('/en/multi-choice')
  await page.locator('#lang-dropdown-btn').click()
  await expect(page.locator('#lang-dropdown-btn')).toHaveAttribute('aria-expanded', 'true')
  await page.getByRole('link', { name: 'Deutsch' }).click()

  await expect(page).toHaveURL(/\/de\/multi-choice\/?$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Implikations-Trainer' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'de')
})

test('has the canonical url and the standard Open Graph image', async ({ page }) => {
  await page.goto('/de/')

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://implications-trainer.netlify.app/de/')
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://implications-trainer.netlify.app/og-image.png')
})

test.describe('accessibility', () => {
  for (const path of ['/en/', '/de/', '/en/multi-choice']) {
    for (const colorScheme of ['dark', 'light'] as const) {
      test(`${path} has no violations in ${colorScheme} mode`, async ({ page }) => {
        await page.emulateMedia({ colorScheme })
        await page.goto(path)
        await expect(page.locator('[data-quiz]')).toBeVisible()
        await page.locator('.option-button, .option-checkbox').first().click()

        const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()

        expect(violations.map(({ id, nodes }) => `${id}: ${nodes.map(({ target }) => target.join(' ')).join(', ')}`)).toEqual([])
      })
    }
  }

  test('does not scroll horizontally on small screens', async ({ page }) => {
    await page.goto('/en/')
    await expect(page.locator('[data-quiz]')).toBeVisible()

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

    expect(overflow).toBeLessThanOrEqual(0)
  })
})
