export default async function run(page, ui) {
  await ui.fill('@e4', 'Test User');
  await ui.fill('@e5', 'testuser_' + Date.now() + '@example.com');
  await ui.fill('@e6', 'User@123');
  await ui.click('@e9'); // Continue to Step 2
  await page.waitForTimeout(1000);

  const s2 = await ui.snapshot();
  return { snapshot2: s2 };
}
