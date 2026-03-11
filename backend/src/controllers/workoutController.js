export function createWorkoutController(workoutService) {
  return {
    getCalendar(req, res) {
      try {
        const month = Number.parseInt(req.query.month, 10);
        const year = Number.parseInt(req.query.year, 10);
        const { userId } = req.user;

        const calendar = workoutService.getCalendar({ userId, month, year });
        return res.status(200).json(calendar);
      } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ error: err.message });
      }
    },

    scheduleWorkout(req, res) {
      try {
        const { day, month, year } = req.body;
        const { userId } = req.user;

        const workout = workoutService.scheduleWorkout({ userId, day, month, year });
        return res.status(201).json(workout);
      } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ error: err.message });
      }
    },

    unscheduleWorkout(req, res) {
      try {
        const { day, month, year } = req.body;
        const { userId } = req.user;

        workoutService.unscheduleWorkout({ userId, day, month, year });
        return res.status(204).send();
      } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ error: err.message });
      }
    },
  };
}
