import { expect, test } from '@playwright/test';

for (const r of ['', 'events/earthquake-in-the-days-of-uzziah/', 'timeline/', 'map/', 'books/amos/1/', 'sources/', 'progress/']) {
  test(`no horizontal page overflow on /${r}`, async ({ page }) => {
    await page.goto(r);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
