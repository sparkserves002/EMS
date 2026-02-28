const { getDB } = require('./config/db');

function toFirestoreDoc(doc) {
  return {
    id: doc._id,
    data() {
      const cloned = { ...doc };
      delete cloned._id;
      return cloned;
    }
  };
}

function buildMongoFilter(clauses) {
  const filter = {};

  for (const clause of clauses) {
    const { field, op, value } = clause;
    if (op === '==') {
      filter[field] = value;
      continue;
    }

    if (op === 'in') {
      filter[field] = { $in: value };
      continue;
    }

    if (!filter[field] || typeof filter[field] !== 'object' || Array.isArray(filter[field])) {
      filter[field] = {};
    }

    if (op === '>=') filter[field].$gte = value;
    if (op === '<=') filter[field].$lte = value;
    if (op === '>') filter[field].$gt = value;
    if (op === '<') filter[field].$lt = value;
  }

  return filter;
}

function createSnapshot(docs) {
  const wrapped = docs.map(toFirestoreDoc);
  return {
    docs: wrapped,
    size: wrapped.length,
    empty: wrapped.length === 0,
    forEach(callback) {
      wrapped.forEach(callback);
    }
  };
}

function createQuery(col, clauses = [], sort = [], max = null) {
  return {
    where(field, op, value) {
      return createQuery(col, [...clauses, { field, op, value }], sort, max);
    },
    orderBy(field, direction = 'asc') {
      return createQuery(col, clauses, [...sort, [field, direction === 'desc' ? -1 : 1]], max);
    },
    limit(value) {
      return createQuery(col, clauses, sort, value);
    },
    async get() {
      const filter = buildMongoFilter(clauses);
      let cursor = col.find(filter);
      if (sort.length) cursor = cursor.sort(Object.fromEntries(sort));
      if (typeof max === 'number') cursor = cursor.limit(max);
      const docs = await cursor.toArray();
      return createSnapshot(docs);
    }
  };
}

function createCollectionApi(name) {
  const db = getDB();
  const col = db.collection(name);

  const query = createQuery(col);

  return {
    ...query,
    doc(id) {
      return {
        async get() {
          const doc = await col.findOne({ _id: id });
          if (!doc) {
            return {
              id,
              exists: false,
              data() {
                return undefined;
              }
            };
          }

          return {
            id,
            exists: true,
            data() {
              const cloned = { ...doc };
              delete cloned._id;
              return cloned;
            }
          };
        },
        async set(payload, options = {}) {
          if (options && options.merge) {
            await col.updateOne({ _id: id }, { $set: payload }, { upsert: true });
            return;
          }
          await col.replaceOne({ _id: id }, { _id: id, ...payload }, { upsert: true });
        },
        async update(payload) {
          await col.updateOne({ _id: id }, { $set: payload });
        },
        async delete() {
          await col.deleteOne({ _id: id });
        }
      };
    },
    async add(payload) {
      const id = Date.now().toString();
      await col.insertOne({ _id: id, ...payload });
      return { id };
    }
  };
}

function createMongoDbApi() {
  return {
    collection(name) {
      return createCollectionApi(name);
    }
  };
}

module.exports = {
  createMongoDbApi
};
