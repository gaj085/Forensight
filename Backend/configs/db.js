const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const mongoUri = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const client = new MongoClient(mongoUri, {
  serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS, 10) || 5000
});

let db = null;
let usersCollection = null;
let criminalsCollection = null;

async function connectDb() {
  if (db) return db;
  try {
    await client.connect();
    db = client.db('face_recognition_db');
    usersCollection = db.collection('users');
    criminalsCollection = db.collection('criminals');
    console.log('Connected to MongoDB database successfully.');
    return db;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

function getDb() {
  return db;
}

function getUsersCollection() {
  return usersCollection;
}

function getCriminalsCollection() {
  return criminalsCollection;
}

module.exports = {
  connectDb,
  getDb,
  getUsersCollection,
  getCriminalsCollection,
  client
};
