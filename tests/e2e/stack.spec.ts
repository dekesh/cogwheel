import { expect, test } from '@playwright/test';

test('stacks one gear on top of another and keeps it on top after selecting the lower one', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 1100 });
  await page.goto('/');

  const main = page.getByRole('main');

  await expect(main.getByText('Driver gear')).toBeVisible();

  const driverCard = page.locator('[data-testid="gear-card-gear-driver"]');
  const drivenCard = page.locator('[data-testid="gear-card-gear-driven"]');

  const driverBox = await driverCard.boundingBox();
  const drivenBox = await drivenCard.boundingBox();

  if (!driverBox || !drivenBox) {
    throw new Error('Expected both gear bounding boxes');
  }

  const drivenCenter = {
    x: drivenBox.x + drivenBox.width / 2,
    y: drivenBox.y + drivenBox.height / 2,
  };

  await page.mouse.move(driverBox.x + driverBox.width / 2, driverBox.y + driverBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(drivenCenter.x, drivenCenter.y, { steps: 20 });
  await page.mouse.up();

  await expect(main.getByText('Center: (120.0, 60.0) mm')).toHaveCount(2);

  const driverZAfterStack = await driverCard.evaluate((element) =>
    Number(window.getComputedStyle(element).zIndex),
  );
  const drivenZAfterStack = await drivenCard.evaluate((element) =>
    Number(window.getComputedStyle(element).zIndex),
  );
  expect(driverZAfterStack).toBeGreaterThan(drivenZAfterStack);

  const drivenBoxAfterStack = await drivenCard.boundingBox();
  if (!drivenBoxAfterStack) throw new Error('Expected driven box after stack');

  await drivenCard.evaluate((element) => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });

  const driverZAfterClick = await driverCard.evaluate((element) =>
    Number(window.getComputedStyle(element).zIndex),
  );
  const drivenZAfterClick = await drivenCard.evaluate((element) =>
    Number(window.getComputedStyle(element).zIndex),
  );

  expect(driverZAfterClick).toBeGreaterThan(drivenZAfterClick);
});
