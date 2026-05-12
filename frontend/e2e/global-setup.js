export default async function globalSetup() {
  try {
    process.loadEnvFile(new URL('../../.env', import.meta.url));
  } catch {
    // .env absent (CI injects env vars directly) — proceed
  }

  const { wipeE2eData } = await import('../../backend/scripts/wipeE2eData.js');
  try {
    await wipeE2eData();
  } catch (err) {
    console.error('[e2e setup] cleanup failed:', err);
  }
}
