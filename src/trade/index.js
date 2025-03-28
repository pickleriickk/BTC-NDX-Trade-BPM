const { fetchHistoricalData } = require('./data');
const { getActionSignal } = require('./indicator');
const { constants } = require('../constants');
const init = async () => {
  await fetchHistoricalData();
};

const fetchLatestPrice = async (req, res) => {
  res.respond(req, {
    btcPrice: constants.HISTORICAL_DATA.bitcoin.slice(-1)[0].price,
    ndxPrice: constants.HISTORICAL_DATA.nasdaq.slice(-1)[0].price,
  });
};

module.exports = {
  init,
  getActionSignal,
  fetchLatestPrice,
};
