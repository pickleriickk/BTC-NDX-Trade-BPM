const { constants } = require('../constants');
const { events, rawEvents, insert, getAll } = require('../db');

const storeEvent = async (db, data) => {
  try {
    await insert(db, data);
  } catch (e) {
    console.error('Error storing event:', e);
  }
};
const pushEvent = (
  instanceId,
  key,
  value,
  ts,
  init = false,
  serverTime = null,
) => {
  serverTime = serverTime || new Date().getTime();
  const event = { value, time: ts, serverTime: serverTime };
  constants.EVENTS[instanceId] = constants.EVENTS[instanceId] || {};
  constants.EVENTS[instanceId][key] = constants.EVENTS[instanceId][key] || [];
  if (!init) {
    console.log('Event:', instanceId, key, JSON.stringify(event));
    storeEvent(events, { instanceId, key, value, ts, serverTime });
  }

  const eventsArray = constants.EVENTS[instanceId][key];
  let i = eventsArray.length - 1;
  while (i >= 0 && eventsArray[i].time > event.time) {
    i--;
  }
  eventsArray.splice(i + 1, 0, event);
};

const handleTransactionSignal = (stream, instanceId) => {
  const ACTION = stream.id.includes('btc') ? 'btcAction' : 'ndxAction';
  const AMOUNT = stream.id.includes('btc') ? 'btcAmount' : 'ndxAmount';
  if (stream.source === 'buy') {
    pushEvent(instanceId, ACTION, 'BUY', stream.timestamp);
    pushEvent(instanceId, AMOUNT, stream.value, stream.timestamp);
    pushEvent(instanceId, 'balance', 0, stream.timestamp);
  } else {
    pushEvent(instanceId, ACTION, 'SELL', stream.timestamp);
    pushEvent(instanceId, AMOUNT, 0, stream.timestamp);
    pushEvent(instanceId, 'balance', stream.value, stream.timestamp);
  }
};
const parseStream = (stream) => {
  return {
    id: stream['stream:point']['stream:id'],
    value: stream['stream:point']['stream:value'],
    timestamp: new Date(stream['stream:point']['stream:timestamp']).getTime(),
    source: stream['stream:point']['stream:source'],
  };
};
const init = async () => {
  let allEvents = await getAll(events);
  allEvents = allEvents.sort((a, b) => a.ts - b.ts);
  allEvents.forEach((event) => {
    pushEvent(
      event.instanceId,
      event.key,
      event.value,
      event.ts,
      true,
      event.serverTime,
    );
  });
};
const handleEvent = (body) => {
  body = Object.assign({}, body);
  storeEvent(rawEvents, body);
  if (body.topic !== 'stream' || body.event !== 'extraction') {
    return console.log('not a stream event');
  }
  try {
    body.notification = JSON.parse(body.notification);
  } catch (e) {
    return console.log('not a valid notification');
  }
  if (
    body.notification.content.attributes.model_uuid !== constants.MODEL_UUID
  ) {
    return console.log('not the right model uuid');
  }
  const instanceId = body.notification.instance;
  for (let stream of body.notification.datastream || []) {
    stream = parseStream(stream);
    switch (stream.id) {
      case constants.EVENT_TYPE.tradeSignal:
        pushEvent(
          instanceId,
          'btcSignal',
          stream.value.btcSignal,
          stream.timestamp,
        );
        pushEvent(
          instanceId,
          'ndxSignal',
          stream.value.ndxSignal,
          stream.timestamp,
        );
        break;
      case constants.EVENT_TYPE.price:
        pushEvent(
          instanceId,
          'btcPrice',
          stream.value.btcPrice,
          stream.timestamp,
        );
        pushEvent(
          instanceId,
          'ndxPrice',
          stream.value.ndxPrice,
          stream.timestamp,
        );
        break;
      case constants.EVENT_TYPE.balance:
        pushEvent(
          instanceId,
          'balance',
          stream.value.balance,
          stream.timestamp,
        );
        pushEvent(
          instanceId,
          'unrealizedBalance',
          stream.value.unrealizedBalance,
          stream.timestamp,
        );
        break;
      case constants.EVENT_TYPE.buyBTC:
        handleTransactionSignal(stream, instanceId);
        break;
      case constants.EVENT_TYPE.sellBTC:
        handleTransactionSignal(stream, instanceId);
        break;
      case constants.EVENT_TYPE.buyNDX:
        handleTransactionSignal(stream, instanceId);
        break;
      case constants.EVENT_TYPE.sellNDX:
        handleTransactionSignal(stream, instanceId);
        break;
      case constants.EVENT_TYPE.initialInfo:
        pushEvent(
          instanceId,
          'balance',
          stream.value.balance,
          stream.timestamp,
        );
        pushEvent(
          instanceId,
          'unrealizedBalance',
          stream.value.unrealizedBalance,
          stream.timestamp,
        );
        pushEvent(
          instanceId,
          'btcPrice',
          stream.value.btcPrice,
          stream.timestamp,
        );
        pushEvent(
          instanceId,
          'ndxPrice',
          stream.value.ndxPrice,
          stream.timestamp,
        );
        pushEvent(
          instanceId,
          'btcSignal',
          stream.value.btcSignal,
          stream.timestamp,
        );
        pushEvent(
          instanceId,
          'ndxSignal',
          stream.value.ndxSignal,
          stream.timestamp,
        );
        pushEvent(
          instanceId,
          'btcAmount',
          stream.value.btcAmount,
          stream.timestamp,
        );
        pushEvent(
          instanceId,
          'ndxAmount',
          stream.value.ndxAmount,
          stream.timestamp,
        );
        break;
      default:
        console.log('unknown event: ', stream);
        break;
    }
  }
};

const getEvents = async (req, res) => {
  res.json(constants.EVENTS);
};

const getNewEvents = async (req, res) => {
  const lastFetchTime = req.query.lastFetchTime;
  console.log('lastFetchTime', lastFetchTime);
  const latestEvents = {};
  let latestEventTime = lastFetchTime;
  for (const instanceId in constants.EVENTS) {
    for (const key in constants.EVENTS[instanceId]) {
      const events = constants.EVENTS[instanceId][key];
      const newEvents = events.filter(
        (event) => event.serverTime > lastFetchTime,
      );
      if (newEvents.length > 0) {
        latestEvents[instanceId] = latestEvents[instanceId] || {};
        latestEvents[instanceId][key] = newEvents;
        latestEventTime = Math.max(
          latestEventTime,
          newEvents.reduce((max, event) => Math.max(max, event.serverTime), 0),
        );
      }
    }
  }
  res.json({ events: latestEvents, lastFetchTime: latestEventTime });
};
module.exports = {
  handleEvent,
  init,
  getEvents,
  getNewEvents,
};
