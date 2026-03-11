export function createWorkoutRepository(db) {
  const insertStmt = db.prepare(
    'INSERT INTO workouts (user_id, day, month, year) VALUES (@userId, @day, @month, @year)',
  );
  const findByMonthStmt = db.prepare(
    'SELECT id, day, month, year FROM workouts WHERE user_id = @userId AND month = @month AND year = @year ORDER BY day',
  );
  const removeStmt = db.prepare(
    'DELETE FROM workouts WHERE user_id = @userId AND day = @day AND month = @month AND year = @year',
  );
  const countByYearStmt = db.prepare(
    'SELECT COUNT(*) as count FROM workouts WHERE user_id = @userId AND year = @year',
  );

  return {
    findByMonth({ userId, month, year }) {
      return findByMonthStmt.all({ userId, month, year });
    },

    create({ userId, day, month, year }) {
      const info = insertStmt.run({ userId, day, month, year });
      return { id: info.lastInsertRowid, day, month, year };
    },

    remove({ userId, day, month, year }) {
      const result = removeStmt.run({ userId, day, month, year });
      return result.changes > 0;
    },

    countByYear({ userId, year }) {
      const row = countByYearStmt.get({ userId, year });
      return row.count;
    },
  };
}
