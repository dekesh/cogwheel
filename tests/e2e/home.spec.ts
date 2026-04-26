import { expect, test } from '@playwright/test';

test('loads the shell and sample gear cards', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1100 });
  await page.goto('/');

  await expect(page.getByText('Cogwheel Designer')).toBeVisible();

  const main = page.getByRole('main');

  await expect(main.getByText('Driver gear')).toBeVisible();
  await expect(main.getByText('Driven gear')).toBeVisible();
  await expect(main.getByLabel('Driver gear preview')).toBeVisible();

  await page.getByRole('button', { name: 'Add gear' }).click();
  await expect(main.getByText('Gear 3')).toBeVisible();

  const newGear = page.locator('[data-testid="gear-card-gear-3"]');
  const newGearBox = await newGear.boundingBox();

  if (!newGearBox) {
    throw new Error('Gear 3 bounding box was not available');
  }

  await page.mouse.move(newGearBox.x + newGearBox.width / 2, newGearBox.y + newGearBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    newGearBox.x + newGearBox.width / 2 + 110,
    newGearBox.y + newGearBox.height / 2 - 30,
    {
      steps: 10,
    },
  );
  await page.mouse.up();

  await expect(page.getByText(/Position:/)).toContainText('Position:');
  await page.getByRole('textbox', { name: 'Label' }).fill('Edited gear');
  await expect(main.getByText('Edited gear')).toBeVisible();
  await page.getByRole('checkbox', { name: 'Include shaft piece in export' }).check();
  await page.getByRole('textbox', { name: 'Shaft clearance (mm)' }).fill('0.4');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export selected SVG' }).click();
  const download = await downloadPromise;
  await expect(download.suggestedFilename()).toContain('.svg');

  const removeButton = page.getByRole('button', { name: 'Remove gear' });
  await removeButton.scrollIntoViewIfNeeded();
  await removeButton.evaluate((element) => {
    (element as HTMLButtonElement).click();
  });
  await expect(main.getByText('Gear 3')).toHaveCount(0);
});
