import mongoose from 'mongoose';

const workoutSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    day: { type: Number, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
  },
  { timestamps: true },
);

workoutSchema.index({ userId: 1, day: 1, month: 1, year: 1 }, { unique: true });

export const Workout = mongoose.model('Workout', workoutSchema);
