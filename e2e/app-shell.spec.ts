import { expect, test } from '@playwright/test';

test('opens the teacher workspace', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Exam Checker' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Scan sheets' })).toBeVisible();
});
