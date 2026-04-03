import { startVitest } from 'vitest/node';
async function run() {
  const vitest = await startVitest('test', ['src/pages/LandingPage.test.jsx'], { watch: false });
  await vitest.close();
}
run();
