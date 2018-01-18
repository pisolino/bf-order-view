import { apiRequest } from './request';
import _ from 'lodash';
import moment from 'moment-timezone';
import q from 'q';
import querystring from 'querystring';

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

}

const getBalance = () => {
  const deferred = q.defer();
  const message = [];
  apiRequest('GET', `me/getbalance`, '', (err, response, payload) => {
    const res = JSON.parse(payload);
    console.log(res);
    message.push(res);
    deferred.resolve(message);
  });

  return deferred.promise;
};

const getCollateral = () => {
  const deferred = q.defer();
  apiRequest('GET', `me/getcollateral`, '', (err, response, payload) => {
    const res = JSON.parse(payload);
    deferred.resolve(res);
  });

  return deferred.promise;
};

const getCollateralHistory = (req) => {
  const deferred = q.defer();
  const message = [];
  const { count = 100, desc = false } = req.query;
  const params = { count };
  apiRequest('GET', `me/getcollateralhistory?${querystring.stringify(params)}`, '', (err, response, payload) => {
    const res = JSON.parse(payload);
    const histories = desc ? _.reverse(res) : res;
    _.forEach(histories, (history) => {
      message.push('------------------------------');
      message.push(`id: ${history.id}`);
      message.push(`変動額: ${history.change}`);
      message.push(`残高 ${history.amount}円`);
      message.push(`reason_code: ${history.reason_code}`);
      message.push(`変動日時 ${moment(history.date + 'Z').tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm:ss')}`);
    });
    deferred.resolve(message);
  });

  return deferred.promise;
};

// getBalance();
// getCollateral();

export const status = {
  getBalance,
  getCollateral,
  getCollateralHistory
};
