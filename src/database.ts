import mongoose, { Connection } from 'mongoose';

let connection: Connection | null = null;

export async function connect(): Promise<void> {
  if (connection) return;
  const mongoURI =
    process.env.MONGO_URI || 'mongodb://localhost:27017/database';

  try {
    await mongoose.connect(mongoURI);
    console.log('Connection established successfully');
  } catch (error) {
    console.log('Something went wrong', error);
    mongoose.disconnect();
  }

  connection = mongoose.connection;
}

export async function disconnect(): Promise<void> {
  if (!connection) return;

  mongoose.disconnect();
  connection = null;
}

export async function cleanup(): Promise<void> {
  if (connection) {
    for (const collection in connection?.collections) {
      await connection?.collections[collection]?.deleteMany({});
    }
  }
}
