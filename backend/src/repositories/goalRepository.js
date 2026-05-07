import mongoose from 'mongoose';
import { Goal } from '../database/models/Goal.js';

export function createGoalRepository() {
  return {
    async findByUser(userId) {
      const doc = await Goal.findOne({ userId: new mongoose.Types.ObjectId(userId) }).lean();
      if (!doc) return undefined;
      return { ...doc, id: doc._id.toString() };
    },

    async upsert({ userId, goal, year }) {
      const doc = await Goal.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        { goal: Number(goal), year: Number(year) },
        { upsert: true, new: true },
      ).lean();
      return { ...doc, id: doc._id.toString() };
    },
  };
}
