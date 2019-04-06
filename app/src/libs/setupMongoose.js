import mongoose from 'mongoose';
import Promise from 'bluebird';

import logger from './logger';

/**
 * Mongo Initializers
 */
mongoose.Promise = Promise;

const maxTries = 5; // Reconnect 5 times
const interval = 3000; //  Reconnect every 3 seconds

let tries = 0; // tries counter

const mongooseOptions = {
  keepAlive: true,
  connectTimeoutMS: 30000, // Give up initial connection after 30 seconds
  useNewUrlParser: true,
};

const NODE_DB_URI = process.env.DB_URI;

const db = mongoose.connection;

function _connect() {
  mongoose.connect(NODE_DB_URI, mongooseOptions)
    .catch((err) => {
      throw err;
    });
}

db.on('open', () => logger.info(`Connected to the ${NODE_DB_URI}.`));
db.on('error', (err) => {
  logger.error(`Database error: ${err}`);
  mongoose.disconnect();
});
db.on('reconnected', () => logger.info(`Reconnected to the ${NODE_DB_URI}.`));
db.on('disconnected', () => {
  logger.info('MongoDB disconnected!');
  // Reconnect
  if (tries !== maxTries) {
    setTimeout(() => {
      _connect();
      tries += 1;
    }, interval);
  }
});

_connect();