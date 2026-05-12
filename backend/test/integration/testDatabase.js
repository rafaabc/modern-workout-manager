import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Ensure models are registered before any test runs
import '../../src/database/models/User.js';
import '../../src/database/models/Workout.js';
import '../../src/database/models/Goal.js';

let mongod;

export async function startTestDatabase() {
  delete process.env.MONGODB_URI;
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  if (!/^mongodb:\/\/127\.0\.0\.1:/.test(uri)) {
    throw new Error(`Refusing to connect tests to non-in-memory Mongo: ${uri}`);
  }
  await mongoose.connect(uri);
}

export async function clearCollections() {
  await Promise.all(
    Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})),
  );
}

export async function stopTestDatabase() {
  await mongoose.disconnect();
  await mongod.stop();
}
