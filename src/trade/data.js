const yahooFinance = require('yahoo-finance2').default;
const axios = require('axios');
const { constants } = require('../constants');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithRetry = async (fetchFunction, retries = 3, delay = 1000) => {
  try {
    return await fetchFunction();
  } catch (error) {
    if (retries > 0) {
      console.warn(`Retrying... attempts left: ${retries}`);
      await sleep(delay);
      return fetchWithRetry(fetchFunction, retries - 1, delay * 2);
    } else {
      console.error('Max retries reached. Throwing error.');
      throw error;
    }
  }
};

const getBitcoinData = async () => {
  return fetchWithRetry(async () => {
    const endTime = Math.floor(Date.now() / 1000);
    const startTime = endTime - 6 * 60 * 60;
    const response = await axios.get(
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/historical?symbol=BTC&time_start=${startTime}&time_end=${endTime}&interval=5m`,
      {
        headers: {
          'X-CMC_PRO_API_KEY': constants.COIN_MARKET_CAP_API_KEY,
        },
      },
    );
    return response.data.data.quotes.map((q) => ({
      price: q.quote.USD.price,
      timestamp: new Date(q.timestamp).getTime(),
    }));
  });
};

const getCurrentBitcoinPrice = async () => {
  return fetchWithRetry(async () => {
    const response = await axios.get(
      'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest',
      {
        headers: {
          'X-CMC_PRO_API_KEY': process.env.COIN_MARKET_CAP_API_KEY,
        },
        params: {
          symbol: 'BTC',
          convert: 'USD',
        },
      },
    );
    return response.data.data.BTC.quote.USD.price;
  });
};

/**
 * Fetches current NASDAQ price from Yahoo Finance
 * @returns {Promise<number>} Current NASDAQ composite index value
 */
const getCurrentNasdaqPrice = async () => {
  return fetchWithRetry(async () => {
    const result = await yahooFinance.quote('^NDX');
    return result.regularMarketPrice;
  });
};

async function getNasdaqData() {
  const now = new Date();
  const startDate = new Date(now - 6 * 60 * 60 * 1000);

  return fetchWithRetry(async () => {
    const result = await yahooFinance._chart('^NDX', {
      interval: '5m',
      range: '12h',
      period1: startDate,
      period2: now,
    });
    return result.quotes.map((q) => ({
      price: q.close,
      timestamp: new Date(q.date).getTime(),
    }));
  });
}

const keepFetching = async (type) => {
  let last = constants.HISTORICAL_DATA[type].slice(-1)[0];
  const waitingTime = last.timestamp + 1.1 * 60 * 1000 - new Date().getTime();
  console.log(
    `Last ${type} price: ${last.price} fetched at ${new Date(
      last.timestamp,
    ).toISOString()}, sleeping for ${waitingTime} ms`,
  );
  await sleep(waitingTime);
  if (type === 'bitcoin') {
    const bitcoinPrice = await getCurrentBitcoinPrice();
    last = {
      price: bitcoinPrice,
      timestamp: new Date().getTime(),
    };
  } else {
    const nasdaqPrice = await getCurrentNasdaqPrice();
    last = {
      price: nasdaqPrice,
      timestamp: new Date().getTime(),
    };
  }
  if (constants.HISTORICAL_DATA[type].slice(-1)[0].price !== last.price) {
    constants.HISTORICAL_DATA[type].push(last);
  } else {
    constants.HISTORICAL_DATA[type][
      constants.HISTORICAL_DATA[type].length - 1
    ].timestamp = last.timestamp;
  }
  keepFetching(type);
};

const fetchHistoricalData = async () => {
  const [nasdaqData, bitcoinData] = await Promise.all([
    getNasdaqData(),
    getBitcoinData(),
  ]);
  constants.HISTORICAL_DATA = {
    bitcoin: bitcoinData,
    nasdaq: nasdaqData,
  };
  keepFetching('bitcoin');
  keepFetching('nasdaq');
};

module.exports = {
  fetchHistoricalData,
};
