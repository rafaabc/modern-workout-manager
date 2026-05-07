export function createWorkoutController(workoutService) {
  return {
    async getCalendar(req, res) {
      try {
        const month = Number.parseInt(req.query.month, 10);
        const year = Number.parseInt(req.query.year, 10);
        const { userId } = req.user;

        const calendar = await workoutService.getCalendar({ userId, month, year });
        return res.status(200).json(calendar);
      } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ error: err.message });
      }
    },

    async scheduleWorkout(req, res) {
      try {
        const { day, month, year } = req.body;
        const { userId } = req.user;

        const workout = await workoutService.scheduleWorkout({ userId, day, month, year });
        return res.status(201).json(workout);
      } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ error: err.message });
      }
    },

    async unscheduleWorkout(req, res) {
      try {
        const { day, month, year } = req.body;
        const { userId } = req.user;

        await workoutService.unscheduleWorkout({ userId, day, month, year });
        return res.status(204).send();
      } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ error: err.message });
      }
    },
  };
}
