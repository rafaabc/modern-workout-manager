export default async function globalTeardown() {
  const { wipeE2eData } = await import('../../backend/scripts/wipeE2eData.js');
  try {
    await wipeE2eData();
  } catch (err) {
    console.error('[e2e teardown] cleanup failed:', err);
  }
}
