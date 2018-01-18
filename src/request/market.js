import { apiRequest } from './request';
import { API_PARAMS } from '../const';
import { shared } from '../shared';
import _ from 'lodash';
import PubNub from 'pubnub';
import q from 'q';
import moment from 'moment-timezone';


const MARKET = {
  HEALTH: {
    'NORMAL': '正常稼働中',
    'BUSY': '負荷状態',
    'VERY BUSY': '高負荷状態',
    'SUPER BUSY': '過負荷常態',
    'NO ORDER': '発注中止中',
    'STOP': '取引所停止中'
  },
  STATE: {
    'RUNNING': '通常稼働中',
    'CLOSED': '取引停止中',
    'STARTING': '再起動中',
    'PREOPEN': '板寄せ中',
    'CIRCUIT BREAK': 'サーキットブレイク発動中',
    'AWAITING SQ': 'Lightning Futures の取引終了後 SQ（清算値）の確定前',
    'MATURED': 'Lightning Futures の満期に到達'
  },
  COLLATERAL: {
    collateral: '評価額',
    open_position_pnl: '評価損益',
    require_collateral: '必要証拠金',
    keep_rate: '証拠金維持率'
  }

};

const pubnub = new PubNub({
   subscribeKey: 'sub-c-52a9ab50-291b-11e5-baaa-0619f8945a4f'
});

const getBoard = () => {
  const deferred = q.defer();
  const message = [];
  apiRequest('GET', `getboard?product_code=${API_PARAMS.PRODUCT_CODE}`, '', (err, response, payload) => {
    const res = JSON.parse(payload);
    // console.log(res);
    console.log(res.mid_price);
    const bidsPower = _(res.bids).orderBy('price', 'desc').value();
    const asksPower = _(res.asks).orderBy('price', 'asc').value();
    console.log(`Bids Power: ${_.sumBy(bidsPower, 'size')}`);
    console.log(`Asks Power: ${_.sumBy(asksPower, 'size')}`);
    message.push(`Bids Power: ${_.sumBy(bidsPower, 'size')}`);
    message.push(`Asks Power: ${_.sumBy(asksPower, 'size')}`);
    shared.boardData = res;
    subscribeRealtimeApis();

    deferred.resolve(message);
  });

  return deferred.promise;
};

const subscribeRealtimeApis = () => {
  pubnub.addListener({
    message: (msg) => {
      if (msg.channel === 'lightning_board_FX_BTC_JPY') {
        // const { mid_price, asks, bids } = msg.message;
        // shared.boardData.mid_price = mid_price;
        // _.forEach(asks, (ask) => {
        //   const currentPrice = _.find(shared.boardData.asks, { price: ask.price });
        //   if (currentPrice) {
        //     currentPrice.size = ask.size;
        //   } else {
        //     _.assignIn(shared.boardData.asks, ask);
        //   }
        // });
        // _.forEach(bids, (bid) => {
        //   const currentPrice = _.find(shared.boardData.bids, { price: bid.price });
        //   if (currentPrice) {
        //     currentPrice.size = bid.size;
        //   } else {
        //     _.assignIn(shared.boardData.bids, bid);
        //   }
        // });
      } else if (msg.channel === 'lightning_executions_FX_BTC_JPY') {
        const rawShared = {
          buy: [],
          sell: []
        };


        const executions = _.transform(msg.message, (result, m) => {
          // m.sideは'BUY', 'SELL'が大文字で格納されるため変換
          result.unshift({
            side: m.side,
            price: m.price,
            size: m.size,
            execDate: moment(m.exec_date).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm:ss')
          });
        }, []);
        shared.io.emit('executions', { executions });

        _.forEach(msg.message, (m) => {
          // m.sideは'BUY', 'SELL'が大文字で格納されるため変換
          shared.executions[_.toLower(m.side)].unshift({
            side: m.side,
            price: m.price,
            size: m.size,
            execDate: moment(m.exec_date).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm:ss')
          });
        });
        //直近180件格納（件数は適当）
        shared.executions.buy = _.slice(shared.executions.buy, 0, 60 * 3);
        shared.executions.sell = _.slice(shared.executions.sell, 0, 60 * 3);
      } else if (msg.channel === 'lightning_ticker_FX_BTC_JPY') {
        shared.io.emit('ltp', { ltp: msg.message.ltp });
      }
    }
  });
  pubnub.subscribe({
    channels: ['lightning_board_FX_BTC_JPY', 'lightning_executions_FX_BTC_JPY', 'lightning_ticker_FX_BTC_JPY']
  });
};

const generateOrderedExecutions = () => {
  const orderedExecutions = {
    buy: [],
    sell: []
  };
  orderedExecutions.buy = _(shared.executions.buy).groupBy('price').value();
  orderedExecutions.sell = _(shared.executions.sell).groupBy('price').value();
  return orderedExecutions;
};

const getBoardState = () => {
  const deferred = q.defer();
  const message = [];
  apiRequest('GET', `getboardstate?product_code=${API_PARAMS.PRODUCT_CODE}`, '', (err, response, payload) => {
    const res = JSON.parse(payload);
    console.log(`${res.health} - ${MARKET.HEALTH[res.health]}`);
    console.log(`${res.state} - ${MARKET.STATE[res.state]}`);
    message.push(`${res.health} - ${MARKET.HEALTH[res.health]}`);
    message.push(`${res.state} - ${MARKET.STATE[res.state]}`);
    deferred.resolve(message);
  });

  return deferred.promise;
};

getBoardState();

getBoard();

export const market = {
  getBoard,
  getBoardState,
  generateOrderedExecutions
};
