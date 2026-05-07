import mongoose from 'mongoose';

export async function connectMongo(uri) {
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });

  return mongoose.connection;
}
