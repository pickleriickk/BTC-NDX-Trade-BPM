const Datastore = require('nedb');
const path = require('path');

const users = new Datastore({
  filename: path.join(__dirname, '..', 'data', 'users.db'),
  autoload: true,
});

const positions = new Datastore({
  filename: path.join(__dirname, '..', 'data', 'positions.db'),
  autoload: true,
});

const events = new Datastore({
  filename: path.join(__dirname, '..', 'data', 'events.db'),
  autoload: true,
});

const getAll = (collection) => {
  return new Promise((resolve, reject) => {
    collection.find({}, (err, docs) => {
      resolve(docs);
    });
  });
};
// Wrapper functions
const findOne = (collection, query) => {
  return new Promise((resolve, reject) => {
    collection.findOne(query, (err, doc) => {
      if (err) reject(err);
      resolve(doc);
    });
  });
};

const update = (collection, query, update) => {
  return new Promise((resolve, reject) => {
    collection.update(query, update, { upsert: false }, (err, numReplaced) => {
      if (err) reject(err);
      resolve(numReplaced);
    });
  });
};

const insert = (collection, body) => {
  return new Promise((resolve, reject) => {
    collection.insert(body, (err, newDoc) => {
      if (err) reject(err);
      resolve(newDoc);
    });
  });
};

// Export the collections so they can be used in other files
module.exports = {
  users,
  positions,
  events,
  findOne,
  update,
  insert,
  getAll,
};
