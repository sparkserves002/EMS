// Simple in-memory Firestore mock for local development and testing
function createMockDb() {
  const store = {};

  function collection(name) {
    if (!store[name]) store[name] = {};
    const col = store[name];
    return {
      doc(id) {
        return makeDocRef(col, id);
      },
      async add(obj) {
        const id = Date.now().toString();
        col[id] = obj;
        return { id };
      },
      async getAll() {
        return Object.keys(col).map(id => ({ id, ...col[id] }));
      }
    };
  }

  function makeDocRef(col, id) {
    return {
      async get() {
        const exists = Object.prototype.hasOwnProperty.call(col, id);
        return {
          exists,
          data() { return col[id]; },
          id
        };
      },
      async set(obj) {
        col[id] = obj;
      },
      async update(obj) {
        if (!Object.prototype.hasOwnProperty.call(col, id)) throw new Error('No document to update');
        col[id] = Object.assign({}, col[id], obj);
      },
      async delete() {
        delete col[id];
      }
    };
  }

  return { collection };
}

module.exports = { createMockDb };
