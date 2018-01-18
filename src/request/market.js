import { apiRequest } from './request';
import { API_PARAMS } from '../const';
import { shared } from '../shared';
import _ from 'lodash';
import PubNub from 'pubnub';
import q from 'q';
import moment from 'moment-timezone';


//TODO: 辞書ファイル or フロントへ移動

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
    const bidsPower = _(res.bids).orderBy('price', 'desc').value();
    const asksPower = _(res.asks).orderBy('price', 'asc').value();
    message.push(`Bids Power: ${_.sumBy(bidsPower, 'size')}`);
    message.push(`Asks Power: ${_.sumBy(asksPower, 'size')}`);
    shared.boardData = res;
    subscribeRealtimeApis();

    deferred.resolve(message);
  });

  return deferred.promise;
};

const subscribeRealtimeApis = () => {
  console.log('pubnub subscribe RealtimeAPI');
  pubnub.addListener({
    message: (msg) => {
      if (msg.channel === 'lightning_executions_FX_BTC_JPY') {
        const executions = _.transform(msg.message, (result, m) => {
          result.unshift({
            side: m.side,
            price: m.price,
            size: m.size,
            execDate: moment(m.exec_date).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm:ss')
          });
        }, []);
        shared.io.emit('executions', { executions });
      } else if (msg.channel === 'lightning_ticker_FX_BTC_JPY') {
        shared.io.emit('ltp', { ltp: msg.message.ltp });
      }
    }
  });
  pubnub.subscribe({
    channels: ['lightning_executions_FX_BTC_JPY', 'lightning_ticker_FX_BTC_JPY']
  });
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
  getBoardState
};
