import mongoose from 'mongoose';

let connectionPromise;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    }).catch((error) => {
      connectionPromise = undefined;
      throw error;
    });
  }

  try {
    const conn = await connectionPromise;

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    throw error;
  }
};

export default connectDB;
