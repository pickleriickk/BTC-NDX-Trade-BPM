require('dotenv').config();
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
  await Promise.all([Trade.init(), Event.init()]);
  app.listen(port);
  console.log('App listening on port:', port);
};

init();
