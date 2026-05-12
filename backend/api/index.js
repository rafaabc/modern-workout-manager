import { createApp } from '../src/app.js';
import { connectMongo } from '../src/database/connection.js';

let appInstance;
let connectionPromise;

async function bootstrap() {
  if (!connectionPromise) {
    connectionPromise = connectMongo(process.env.MONGODB_URI);
  }
  await connectionPromise;
  if (!appInstance) appInstance = createApp();
  return appInstance;
}

export default async function handler(req, res) {
  const app = await bootstrap();
  return app(req, res);
}
