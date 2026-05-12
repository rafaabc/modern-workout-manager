import mongoose from 'mongoose';

let connectPromise;

export function connectMongo(uri) {
  if (!connectPromise) {
    connectPromise = mongoose.connect(uri).then((conn) => {
      console.log('Connected to MongoDB');

      conn.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
        connectPromise = null;
      });

      conn.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected');
        connectPromise = null;
      });

      return conn.connection;
    });
  }
  return connectPromise;
}
