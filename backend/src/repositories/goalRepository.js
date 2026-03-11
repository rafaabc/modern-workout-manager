export function createGoalRepository(db) {
  const findByUserStmt = db.prepare(
    'SELECT id, user_id, goal, year, updated_at FROM goals WHERE user_id = ?',
  );
  const upsertStmt = db.prepare(
    `INSERT INTO goals (user_id, goal, year, updated_at)
     VALUES (@userId, @goal, @year, datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET goal = @goal, year = @year, updated_at = datetime('now')`,
  );

  return {
    findByUser(userId) {
      return findByUserStmt.get(userId) || undefined;
    },

    upsert({ userId, goal, year }) {
      upsertStmt.run({ userId, goal, year });
      return findByUserStmt.get(userId);
    },
  };
}
