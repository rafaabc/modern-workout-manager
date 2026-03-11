import { createApp } from '../../src/app.js';

export function createTestServer() {
  const app = createApp(':memory:');

  let server;
  let baseUrl;

  return {
    app,
    async start() {
      return new Promise((resolve) => {
        server = app.listen(0, () => {
          const { port } = server.address();
          baseUrl = `http://localhost:${port}`;
          resolve(baseUrl);
        });
      });
    },
    async close() {
      if (app.db) {
        app.db.close();
      }
      return new Promise((resolve, reject) => {
        if (server) {
          server.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        } else {
          resolve();
        }
      });
    },
    get baseUrl() {
      return baseUrl;
    },
  };
}
