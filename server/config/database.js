const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer = null;

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;
    
    // Try connecting to configured MongoDB first
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000, // 5 second timeout
      });
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (atlasError) {
      console.log('⚠️ Could not connect to MongoDB Atlas, starting local in-memory database...');
      
      // Start in-memory MongoDB server
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
      
      const conn = await mongoose.connect(uri);
      console.log('✅ MongoDB In-Memory Server Connected');
      console.log('📝 Note: Data will be lost when server restarts. Configure MongoDB Atlas for persistence.');
      return conn;
    }
  } catch (error) {
    console.error(`❌ Database Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
