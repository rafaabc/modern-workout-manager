import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Ensure models are registered before any test runs
import '../../src/database/models/User.js';
import '../../src/database/models/Workout.js';
import '../../src/database/models/Goal.js';

let mongod;

export async function startTestDatabase() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
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
