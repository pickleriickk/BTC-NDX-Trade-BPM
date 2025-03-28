const { constants } = require('../constants');
const { getActionSignal } = require('../trade');
const db = require('../db');
const Mutex = require('async-mutex').Mutex;
const lock = {};

const fetchBalance = async (req, res) => {
  const btcPrice = constants.HISTORICAL_DATA.bitcoin.slice(-1)[0].price;
  const ndxPrice = constants.HISTORICAL_DATA.nasdaq.slice(-1)[0].price;
  const [user, position] = await Promise.all([
    db.findOne(db.users, { email: req.body.email }),
    db.findOne(db.positions, {
      email: req.body.email,
      status: 'open',
    }),
  ]);
  const balance = user.balance;
  let unrealizedBalance = balance;
  if (position) {
    unrealizedBalance +=
      position.amount * (position.type === 'BTC' ? btcPrice : ndxPrice);
  }
  res.respond(req, { balance, unrealizedBalance });
};

const fetchAdvice = async (req, res) => {
  try {
    const advice = getActionSignal();
    res.respond(req, {
      btcSignal: advice.btcSignal,
      ndxSignal: advice.ndxSignal,
    });
  } catch (err) {
    res.error(500, err, req);
  }
};

const buy = async (req, res) => {
  try {
    lock[req.body.email] = lock[req.body.email] || new Mutex();
    await lock[req.body.email].acquire();
    const { email, type } = req.body;
    const user = req.existingUser;
    const btcPrice = constants.HISTORICAL_DATA.bitcoin.slice(-1)[0].price;
    const ndxPrice = constants.HISTORICAL_DATA.nasdaq.slice(-1)[0].price;

    if (!user.balance) {
      return res.respond(req, {
        success: false,
        reason: 'Insufficient balance',
      });
    }
    let amount;
    if (type === 'BTC') {
      amount = user.balance / btcPrice;
    } else {
      amount = user.balance / ndxPrice;
    }
    const newPosition = {
      email,
      type,
      amount: amount,
      status: 'open',
      createdAt: new Date().getTime(),
    };
    await Promise.all([
      db.insert(db.positions, newPosition),
      db.update(db.users, { email }, { $set: { balance: 0 } }),
    ]);

    res.respond(req, {
      success: true,
      message: 'Position opened successfully',
      amount,
    });
  } catch (error) {
    res.error(500, error, req);
  } finally {
    lock[req.body.email].release();
  }
};

const sell = async (req, res) => {
  try {
    lock[req.body.email] = lock[req.body.email] || new Mutex();
    await lock[req.body.email].acquire();
    const { email, type } = req.body;
    const position = await db.findOne(db.positions, {
      email,
      type,
      status: 'open',
    });
    if (!position) {
      return res.respond(req, {
        success: false,
        reason: 'No active position',
      });
    }
    const btcPrice = constants.HISTORICAL_DATA.bitcoin.slice(-1)[0].price;
    const ndxPrice = constants.HISTORICAL_DATA.nasdaq.slice(-1)[0].price;
    let dollarAmount;
    if (type === 'BTC') {
      dollarAmount = position.amount * btcPrice;
    } else {
      dollarAmount = position.amount * ndxPrice;
    }
    await Promise.all([
      db.update(db.users, { email }, { $set: { balance: dollarAmount } }),
      db.update(
        db.positions,
        { email, type, status: 'open' },
        { $set: { status: 'closed', closedAt: new Date().getTime() } },
      ),
    ]);

    res.respond(req, {
      success: true,
      message: 'Position closed successfully',
      balance: dollarAmount,
    });
  } catch (err) {
    res.error(500, err, req);
  } finally {
    lock[req.body.email].release();
  }
};

const fetchUserInfo = async (req, res) => {
  try {
    const [user, position] = await Promise.all([
      db.findOne(db.users, { email: req.body.email }),
      db.findOne(db.positions, {
        email: req.body.email,
        status: 'open',
      }),
    ]);
    const response = {
      btcAmount: position && position.type === 'BTC' ? position.amount : 0,
      ndxAmount: position && position.type === 'NDX' ? position.amount : 0,
      btcPrice: constants.HISTORICAL_DATA.bitcoin.slice(-1)[0].price,
      ndxPrice: constants.HISTORICAL_DATA.nasdaq.slice(-1)[0].price,
      initialBalance: user.initialBalance,
      balance: user.balance,
    };
    const advice = getActionSignal();
    response.btcSignal = advice.btcSignal;
    response.ndxSignal = advice.ndxSignal;
    response.unrealizedBalance =
      response.btcAmount * response.btcPrice +
      response.ndxAmount * response.ndxPrice +
      response.balance;
    res.respond(req, response);
  } catch (err) {
    res.error(500, err, req);
  }
};

module.exports = {
  fetchBalance,
  fetchAdvice,
  buy,
  sell,
  fetchUserInfo,
};
