const express = require('express');
require('./middleware/response');
const router = express.Router();
const { login } = require('./login');
const { validate } = require('./middleware/validator');
const { auth } = require('./middleware/auth');
const {
  fetchBalance,
  fetchAdvice,
  buy,
  sell,
  fetchPosition,
  fetchUserInfo,
} = require('./transaction');
const { fetchLatestPrice } = require('./trade');
const { handleEvent, getEvents, getNewEvents } = require('./events');
router.post('/', (req, res) => {
  handleEvent(req.body);
});

router.post('/login', validate, login);

router.get('/user-info', validate, auth, fetchUserInfo);
router.get('/balance', validate, auth, fetchBalance);
router.get('/advice', validate, auth, fetchAdvice);
router.post('/buy', validate, auth, buy);
router.post('/sell', validate, auth, sell);
router.get('/position', validate, auth, fetchPosition);
router.get('/price', validate, auth, fetchLatestPrice);

router.use('/dashboard', express.static('client/build'));
router.get('/dashboard/data', getEvents);
router.get('/dashboard/data/poll', getNewEvents);

module.exports = router;
