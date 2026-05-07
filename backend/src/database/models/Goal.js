import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    goal: { type: Number, required: true },
    year: { type: Number, required: true },
  },
  { timestamps: true },
);

export const Goal = mongoose.model('Goal', goalSchema);
