import mongoose from 'mongoose';
import { Workout } from '../database/models/Workout.js';

export function createWorkoutRepository() {
  return {
    async findByMonth({ userId, month, year }) {
      const docs = await Workout.find({
        userId: new mongoose.Types.ObjectId(userId),
        month,
        year,
      })
        .sort({ day: 1 })
        .lean();
      return docs.map((d) => ({ id: d._id.toString(), day: d.day, month: d.month, year: d.year }));
    },

    async create({ userId, day, month, year }) {
      const doc = await Workout.create({
        userId: new mongoose.Types.ObjectId(userId),
        day,
        month,
        year,
      });
      return { id: doc._id.toString(), day: doc.day, month: doc.month, year: doc.year };
    },

    async remove({ userId, day, month, year }) {
      const result = await Workout.deleteOne({
        userId: new mongoose.Types.ObjectId(userId),
        day,
        month,
        year,
      });
      return result.deletedCount > 0;
    },

    async countByYear({ userId, year }) {
      return Workout.countDocuments({ userId: new mongoose.Types.ObjectId(userId), year });
    },

    async countByYearGrouped({ userId, year }) {
      const results = await Workout.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), year } },
        { $group: { _id: '$month', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]);
      // Normalize to { month, count } to match the shape services expect
      return results.map((r) => ({ month: r._id, count: r.count }));
    },
  };
}
