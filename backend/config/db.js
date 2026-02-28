const { MongoClient } = require("mongodb");

let client;
let database;


 
async function connectDB() {
  if (database) return database;

  let uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || "ems";
  const mongoPassword = process.env.MONGODB_PASSWORD;

  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }

  // Support URI templates like mongodb+srv://user:@host/... by injecting MONGODB_PASSWORD
  const emptyPasswordPattern = /(mongodb(?:\+srv)?:\/\/[^:\/?#]+):@/;
  if (emptyPasswordPattern.test(uri) && mongoPassword) {
    uri = uri.replace(emptyPasswordPattern, `$1:${encodeURIComponent(mongoPassword)}@`);
  }

  // Fail fast with a clearer message than Mongo driver's low-level error
  if (emptyPasswordPattern.test(uri)) {
    throw new Error(
      "MongoDB password is empty in MONGODB_URI. Add the password in MONGODB_URI or set MONGODB_PASSWORD in .env"
    );
  }

  client = new MongoClient(uri);
  await client.connect();

  database = client.db(dbName);
  console.log(`MongoDB connected: ${dbName}`);

  return database;
}

function getDB() {
  if (!database) {
    throw new Error("MongoDB not connected. Call connectDB() first.");
  }
  return database;
}

async function closeDB() {
  if (client) {
    await client.close();
    client = null;
    database = null;
    console.log("MongoDB connection closed");
  }
}

module.exports = {
  connectDB,
  getDB,
  closeDB,
};