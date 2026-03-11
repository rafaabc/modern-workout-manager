import { createApp } from './app.js';

const port = process.env.PORT || 3000;
const dbPath = process.env.DATABASE_PATH || './workout.db';

const app = createApp(dbPath);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api-docs`);
});
