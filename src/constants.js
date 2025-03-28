module.exports.constants = {
  COIN_MARKET_CAP_API_KEY: process.env.COIN_MARKET_CAP_API_KEY,
  HISTORICAL_DATA: {},
  MODEL_UUID: process.env.MODEL_UUID || 'cfaa456f-9a45-4e46-adac-38f9f809ce5b',
  EVENTS: {},
  EVENT_TYPE: {
    tradeSignal: 'trade_signal',
    price: 'price',
    balance: 'balance',
    buyBTC: 'buy_btc',
    sellBTC: 'sell_btc',
    buyNDX: 'buy_ndx',
    sellNDX: 'sell_ndx',
    initialInfo: 'initial_info',
  },
};
