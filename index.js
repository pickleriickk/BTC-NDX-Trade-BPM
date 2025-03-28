require('dotenv').config();
const { constants } = require('./src/constants');
const express = require('express');
const morgan = require('morgan');
const multer = require('multer');
const routes = require('./src/routes');
const app = express();
const port = 14533;
const Trade = require('./src/trade');
const Event = require('./src/events');
const upload = multer();

//app.use(morgan('tiny'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(upload.array());
process.removeAllListeners('warning');
app.use('/', routes);

const init = async () => {
  if (!constants.COIN_MARKET_CAP_API_KEY) {
    console.error(
      'COIN_MARKET_CAP_API_KEY is not set, did you forget to put the .env file?',
    );
    process.exit(1);
  }
  await Promise.all([Trade.init(), Event.init()]);
  app.listen(port);
  console.log('App listening on port:', port);
};

init();
