const { constants } = require('../constants');

// Main function: returns signals for BTC & Nasdaq
const getActionSignal = () => {
  const { bitcoin, nasdaq } = constants.HISTORICAL_DATA;

  const bitcoinIndicators = calculateIndicators(bitcoin);
  const nasdaqIndicators = calculateIndicators(nasdaq);

  // Evaluate each market separately
  const btcScore = evaluateIndicators(bitcoin, bitcoinIndicators);
  const ndxScore = evaluateIndicators(nasdaq, nasdaqIndicators);

  // Use a dead zone to allow more signal changes
  const btcSignal = btcScore >= 0 ? 'BUY' : 'SELL';
  const ndxSignal = ndxScore >= 0 ? 'BUY' : 'SELL';
  console.log('btcScore: ', btcScore, 'ndxScore: ', ndxScore);
  return { btcSignal, ndxSignal };
};

// Make periods even shorter and thresholds looser:
const calculateIndicators = (data) => ({
  bollingerBands: calculateBollingerBands(data, 7, 1.5),
  ema: calculateEMA(data, 5),
  rsi: calculateRSI(data, 5),
  macd: calculateMACD(data, 5, 10, 3),
});

// Evaluate how bullish/bearish the indicators appear
const evaluateIndicators = (data, indicators) => {
  let score = 0;
  const lastPrice = data[data.length - 1].price;
  const { bollingerBands, ema, rsi, macd } = indicators;

  // Bollinger: if price is below lower band, add; above upper band, subtract.
  if (lastPrice < bollingerBands.lowerBand) score += 0.5;
  else if (lastPrice > bollingerBands.upperBand) score -= 0.5;

  // EMA check: reduce penalty if below EMA to lessen sell bias.
  if (lastPrice > ema) score += 0.5;
  else score -= 0.25;

  if (rsi < 40) score += 0.5;
  else if (rsi > 60) score -= 0.5;
  else if (rsi < 45) score += 0.25;
  else if (rsi > 55) score -= 0.25;

  // MACD: reduce penalty on negative crossover.
  if (macd.macdLine > macd.signalLine) score += 0.5;
  else score -= 0.25;

  return score;
};

// Bollinger Bands calculation
const calculateBollingerBands = (data, period = 20, stdDevMultiplier = 2) => {
  const prices = data.map((d) => d.price);
  const recentPrices = prices.slice(-period);

  const movingAverage =
    recentPrices.reduce((sum, price) => sum + price, 0) / period;

  const stdDev = Math.sqrt(
    recentPrices.reduce(
      (sum, price) => sum + Math.pow(price - movingAverage, 2),
      0,
    ) / period,
  );

  return {
    upperBand: movingAverage + stdDevMultiplier * stdDev,
    lowerBand: movingAverage - stdDevMultiplier * stdDev,
    movingAverage,
  };
};

// EMA calculation
const calculateEMA = (data, period = 12) => {
  const prices = data.map((d) => d.price);
  const k = 2 / (period + 1);
  let ema = prices[0];

  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
};

// RSI calculation
const calculateRSI = (data, period = 14) => {
  const prices = data.map((d) => d.price);
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgGain / avgLoss || 0;

  return 100 - 100 / (1 + rs);
};

// MACD calculation
const calculateMACD = (
  data,
  shortPeriod = 12,
  longPeriod = 26,
  signalPeriod = 9,
) => {
  const shortEMA = calculateEMA(data, shortPeriod);
  const longEMA = calculateEMA(data, longPeriod);
  const macdLine = shortEMA - longEMA;

  const signalData = data.slice(-signalPeriod);
  const signalLine = calculateEMA(signalData, signalPeriod);

  return {
    macdLine,
    signalLine,
    histogram: macdLine - signalLine,
  };
};

module.exports = { getActionSignal };
