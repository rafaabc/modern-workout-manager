import { openDatabase } from '../../src/database/database.js';

export function createTestDatabase() {
  return openDatabase(':memory:');
}
