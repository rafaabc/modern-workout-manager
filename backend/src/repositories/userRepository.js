export function createUserRepository(db) {
  const insertStmt = db.prepare(
    'INSERT INTO users (username, password) VALUES (@username, @password)',
  );
  const findByUsernameStmt = db.prepare('SELECT * FROM users WHERE username = ?');

  return {
    findByUsername(username) {
      return findByUsernameStmt.get(username);
    },

    create({ username, password }) {
      const info = insertStmt.run({ username, password });
      return { id: info.lastInsertRowid, username };
    },
  };
}
