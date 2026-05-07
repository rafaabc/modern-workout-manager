import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../../src/app.js';

// Ensure models are registered
import '../../src/database/models/User.js';
import '../../src/database/models/Workout.js';
import '../../src/database/models/Goal.js';

export function createTestServer() {
  let mongod;
  let server;
  let baseUrl;

  return {
    async start() {
      mongod = await MongoMemoryServer.create();
      await mongoose.connect(mongod.getUri());

      const app = createApp();

      return new Promise((resolve) => {
        server = app.listen(0, () => {
          const { port } = server.address();
          baseUrl = `http://localhost:${port}`;
          resolve(baseUrl);
        });
      });
    },

    async close() {
      return new Promise((resolve, reject) => {
        if (server) {
          server.close(async (err) => {
            if (err) return reject(err);
            await mongoose.disconnect();
            await mongod.stop();
            resolve();
          });
        } else {
          resolve();
        }
      });
    },

    async clearCollections() {
      await Promise.all(
        Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})),
      );
    },

    get baseUrl() {
      return baseUrl;
    },
  };
}
