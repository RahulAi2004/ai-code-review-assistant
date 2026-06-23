import mongoose from 'mongoose';

let memoryServer = null;

/**
 * Connect to MongoDB.
 * - If MONGODB_URI is set (e.g. a MongoDB Atlas connection string), use it.
 * - Otherwise spin up an in-memory MongoDB so the app works with zero setup
 *   during development. In-memory data is EPHEMERAL (lost on restart); set
 *   MONGODB_URI for real persistence and for deployment.
 *
 * Connection failure is non-fatal: the core code-review feature still works in
 * "guest mode" (no auth, no saved history). Use isDbReady() to gate DB routes.
 */
export async function connectDB() {
  let uri = process.env.MONGODB_URI;

  if (!uri) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
    console.warn(
      '[db] MONGODB_URI not set — using an in-memory MongoDB (data is ephemeral). ' +
        'Set MONGODB_URI in server/.env for persistence.'
    );
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log('[db] connected');
}

// True once Mongoose has an open connection.
export function isDbReady() {
  return mongoose.connection.readyState === 1;
}

// Used by tests to tear down the in-memory server cleanly.
export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
