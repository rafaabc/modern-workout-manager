import { User } from '../database/models/User.js';

export function createUserRepository() {
  return {
    async findByUsername(username) {
      const doc = await User.findOne({ username: String(username) }).lean();
      if (!doc) return undefined;
      return { ...doc, id: doc._id.toString() };
    },

    async create({ username, password }) {
      const doc = await User.create({ username, password });
      return { id: doc._id.toString(), username: doc.username };
    },
  };
}
