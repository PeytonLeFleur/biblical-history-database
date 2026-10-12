import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const DOSSIER = 'events/earthquake-in-the-days-of-uzziah/';

test.describe('core routes', () => {
  const routes = ['', 'books/', 'books/amos/', 'books/amos/1/', 'books/zechariah/14/', 'books/daniel/5/', 'passage/', DOSSIER, 'events/', 'timeline/', 'map/',
    'people/', 'people/uzziah/', 'kingdoms/', 'kingdoms/judah/', 'artifacts/', 'archaeology/', 'science/', 'sources/', 'prophecies/', 'crossrefs/',
    'search/', 'methodology/', 'progress/', 'about/'];
  for (const r of routes) {
    test(`renders /${r}`, async ({ page }) => {
      const res = await page.goto(r);
      expect(res?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
    });
  }
});

test.describe('event dossier', () => {
  test('connects Amos 1:1 and Zechariah 14:5 with their text', async ({ page }) => {
    await page.goto(DOSSIER);
    const refs = page.locator('#refs').locator('..');
    await expect(refs.getByRole('link', { name: 'Amos 1:1' })).toBeVisible();
    await expect(refs.getByRole('link', { name: 'Zechariah 14:5' })).toBeVisible();
    await expect(page.getByText('two years before the earthquake.').first()).toBeVisible();
    await expect(page.getByText('the earthquake in the days of Uzziah king of Judah').first()).toBeVisible();
  });

  test('keeps each classification attached to its own claim', async ({ page }) => {
    await page.goto(DOSSIER);
    const claims = page.getByTestId('claim');
    await expect(claims).toHaveCount(5);
    const expected: Record<string, string> = {
      'A strong earthquake': 'Strongly supported',
      'The earthquake referred to in Amos 1:1': 'Historically plausible',
      'There was a single regional earthquake': 'Disputed',
      'The earthquake damaged Jerusalem.': 'Historically plausible',
      'The earthquake struck at the moment': 'No independent corroboration found',
    };
    for (const [statement, label] of Object.entries(expected)) {
      const claim = claims.filter({ has: page.locator('h3', { hasText: statement }) });
      await expect(claim).toHaveCount(1);
      await expect(claim.getByTitle('Evidence classification (SPEC 9.1)')).toHaveText(label);
    }
  });

  test('shows the pending owner review accurately and exposes no review controls', async ({ page }) => {
    await page.goto(DOSSIER);
    await expect(page.locator('#review-status')).toContainText('Human review pending');
    await expect(page.locator('#review-status')).toContainText('status open');
    const disputed = page.getByTestId('claim').filter({ hasText: 'There was a single regional earthquake' });
    await expect(disputed.getByText('Owner review pending')).toBeVisible();
    await expect(disputed.getByText('In owner review queue')).toBeVisible();
    await expect(page.getByText('Researched — not human reviewed').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /approve|reject/i })).toHaveCount(0);
  });

  test('shows source verification levels and computed chronology with derivations', async ({ page }) => {
    await page.goto(DOSSIER);
    await expect(page.locator('#sources').locator('..').getByText('Claim checked').first()).toBeVisible();
    await expect(page.locator('#sources').locator('..').getByText('Metadata verified').first()).toBeVisible();
    const models = page.getByTestId('chronology-model');
    await expect(models).toHaveCount(2);
    await expect(models.first()).toContainText('BC');
    await models.first().locator('summary').click();
    await expect(models.first()).toContainText('two years before the earthquake');
    await expect(models.first()).toContainText('reign of');
  });
});

test.describe('timeline', () => {
  test('plots engine-computed windows and switches models', async ({ page }) => {
    await page.goto('timeline/');
    await expect(page.getByTestId('timeline-svg')).toBeVisible();
    const event = page.locator('[data-testid="tl-item-event"]');
    await expect(event).toHaveCount(1);
    await expect(page.getByTestId('tl-item-reign')).toHaveCount(2);
    const table = page.getByTestId('timeline-table');
    const before = await table.innerText();
    const select = page.getByTestId('model-select');
    const options = await select.locator('option').allTextContents();
    const other = options.find((o) => o.includes('Albright')) ?? options[1]!;
    await select.selectOption({ label: other });
    await expect(page.getByTestId('active-model')).toContainText(other);
    await expect.poll(async () => table.innerText()).not.toBe(before);
    await page.locator('[data-testid="tl-item-event"]').click();
    const panel = page.getByTestId('derivation-panel');
    await expect(panel).toContainText('two years before the earthquake');
    await expect(panel).toContainText('Assumption');
    await select.selectOption({ label: 'No chronology model (model-independent)' });
    await expect(table).toContainText('Nothing can be placed');
  });
});

test.describe('map', () => {
  test('renders the map and distinguishes identification from proposed association', async ({ page }) => {
    await page.goto('map/');
    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.locator('canvas.maplibregl-canvas')).toHaveCount(1, { timeout: 15_000 });
    const table = page.getByTestId('map-table');
    await expect(table.getByText('Verified identification')).toHaveCount(4);
    await expect(table.getByText(/association: proposed/)).toHaveCount(3);
    await expect(table.getByText('association: probable')).toHaveCount(1);
  });
});

test.describe('search and passages', () => {
  test('finds the earthquake event', async ({ page }) => {
    await page.goto('search/?q=Earthquake%20during%20Uzziah');
    const first = page.getByTestId('search-results').locator('li').first();
    await expect(first).toContainText('Event');
    await expect(first.getByRole('link')).toHaveAttribute('href', /events\/earthquake-in-the-days-of-uzziah\//);
  });
  test('resolves Bible references', async ({ page }) => {
    await page.goto('search/?q=Daniel%205');
    await expect(page.getByTestId('search-results').getByRole('link', { name: 'Daniel 5' })).toHaveAttribute('href', /books\/daniel\/5\//);
  });
  test('shows an honest empty state for unresearched subjects', async ({ page }) => {
    await page.goto('search/?q=Belshazzar');
    await expect(page.getByTestId('search-results')).toContainText('No published research matches');
  });
  test('passage explorer jumps to the verse', async ({ page }) => {
    await page.goto('passage/?ref=Zech%2014:5');
    await expect(page).toHaveURL(/books\/zechariah\/14\/#v5$/);
    await expect(page.locator('#v5')).toContainText('Uzziah');
  });
});

test.describe('Bible explorer', () => {
  test('Amos 1 shows coverage, candidates and the event link', async ({ page }) => {
    await page.goto('books/amos/1/');
    await expect(page.locator('li.verse')).toHaveCount(15);
    await expect(page.getByText('Reviewed — research candidate')).toHaveCount(15);
    await expect(page.locator('#v1').getByRole('link', { name: /Event: The earthquake/ })).toBeVisible();
  });
  test('unreviewed chapters say so', async ({ page }) => {
    await page.goto('books/daniel/5/');
    await expect(page.getByText('Not yet reviewed.')).toBeVisible();
  });
  test('empty states are labelled', async ({ page }) => {
    await page.goto('artifacts/');
    await expect(page.getByRole('status')).toContainText('No artifact records yet');
  });
});

test.describe('accessibility', () => {
  for (const r of ['', DOSSIER, 'timeline/', 'map/', 'books/amos/1/', 'search/', 'sources/', 'progress/']) {
    test(`no serious axe violations on /${r}`, async ({ page }) => {
      await page.goto(r);
      const results = await new AxeBuilder({ page }).exclude('.maplibregl-canvas-container').analyze();
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
    });
  }
});
