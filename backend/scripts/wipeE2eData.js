import mongoose from 'mongoose';

export async function wipeE2eData() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('[wipeE2eData] MONGODB_URI not set — skipping cleanup.');
    return;
  }

  const needsConnect = mongoose.connection.readyState === 0;
  if (needsConnect) await mongoose.connect(uri);

  const users = mongoose.connection.collection('users');
  const workouts = mongoose.connection.collection('workouts');
  const goals = mongoose.connection.collection('goals');

  const e2eUsers = await users.find({ username: /^e2e_/ }, { projection: { _id: 1 } }).toArray();
  const ids = e2eUsers.map((u) => u._id);

  const wCount = ids.length ? (await workouts.deleteMany({ userId: { $in: ids } })).deletedCount : 0;
  const gCount = ids.length ? (await goals.deleteMany({ userId: { $in: ids } })).deletedCount : 0;
  const uCount = (await users.deleteMany({ username: /^e2e_/ })).deletedCount;

  console.log(`[wipeE2eData] removed: ${uCount} users, ${wCount} workouts, ${gCount} goals`);

  if (needsConnect) await mongoose.disconnect();
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  wipeE2eData().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
