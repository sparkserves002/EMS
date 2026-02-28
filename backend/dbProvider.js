const { createMongoDbApi } = require('./mongoAdapter');

let _mongoDb = null;

function initializeMongoDbAdapter() {
  if (!_mongoDb) _mongoDb = createMongoDbApi();
}

function getDb() {
  if (process.env.DB === 'mongodb') {
    return _mongoDb;
  }

  return null;
}

module.exports = { initializeMongoDbAdapter, getDb };
