import mongoose from 'mongoose';
import { connectMongo } from './database/connection.js';
import { createApp } from './app.js';

const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('MONGODB_URI environment variable is not defined');
  process.exit(1);
}

await connectMongo(mongoUri);

const app = createApp();

const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api-docs`);
});

// Graceful shutdown: Render sends SIGTERM on redeploy
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await mongoose.disconnect();
    process.exit(0);
  });
});
