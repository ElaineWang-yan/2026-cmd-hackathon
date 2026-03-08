/**
 * MongoDB Connection Utility
 * 
 * Manages MongoDB connection using native driver or Mongoose
 */

const { MongoClient, ServerApiVersion } = require('mongodb');

let cachedDb = null;

/**
 * Connect to MongoDB and return database instance
 * 
 * @returns {Promise<Database>} MongoDB database instance
 */
async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const uri = process.env.MONGODB_URI;

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB');

    cachedDb = client.db('medication_forum');
    return cachedDb;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

/**
 * Get posts collection
 */
async function getPostsCollection() {
  const db = await connectToDatabase();
  return db.collection('posts');
}

/**
 * Close MongoDB connection
 */
async function closeDatabase() {
  if (cachedDb) {
    cachedDb.client.close();
    cachedDb = null;
  }
}

module.exports = {
  connectToDatabase,
  getPostsCollection,
  closeDatabase,
};
