import _ from 'lodash';
import moment from 'moment';
import q from 'q';
import { apiRequest } from './request';
import { API_PARAMS } from '../const';

const getChildOrders = () => {
  // const promise = new Promise();
  const deferred = q.defer();
  apiRequest('GET', `me/getchildorders?product_code=${API_PARAMS.PRODUCT_CODE}&child_order_state=ACTIVE`, '', (err, response, payload) => {
    const res = JSON.parse(payload);
    const message = [];
    message.push('-------注文一覧-------');
    if (_.isArray(res) && res.length > 0) {
      _.forEach(res, (value, index) => {
        message.push(`注文ID : ${value.child_order_id}`);
        message.push(`売買 :${value.side}`);
        message.push(`注文種別: ${value.child_order_type}`);
        message.push(`数量: ${value.size}`);
        message.push(`注文状態: ${value.child_order_state}`);
        message.push(`${value.expire_date}`);
        message.push(`${value.child_order_date}`);
        message.push(`${value.child_order_acceptance_id}`);
        message.push(`${value.outstanding_size}`);
        message.push(`${value.cancel_size}`);
        message.push(`${value.executed_size}`);
        message.push(`${value.total_commission}`);
        if (index < res.length) {
          message.push('----------------------');
        }
      });
    } else {
      message.push('注文がありません');
    }
    message.push('----------------------');

    deferred.resolve(message);
  });

  return deferred.promise;
};

const getPositions = () => {
  const deferred = q.defer();
  apiRequest('GET', `me/getpositions?product_code=${API_PARAMS.PRODUCT_CODE}`, '', (err, response, payload) => {
    const res = JSON.parse(payload);
    const message = [];
    let sumPnl = 0;
    message.push('-------建玉一覧-------');
    if (_.isArray(res) && res.length > 0) {
      _.forEach(res, (value, index) => {
        message.push(`売買 :${value.side}`);
        message.push(`約定価格: ${value.price}`);
        message.push(`数量: ${value.size}`);
        message.push(`取引証拠金: ${_.round(value.require_collateral)}`);
        message.push(`注文実行日時: ${moment(value.open_date).utcOffset(9).format('YYYY/MM/DD HH:mm:ss')}`);
        message.push(`評価損益 :${_.round(value.pnl)} 円`);
        sumPnl += _.round(value.pnl);
        if (index < res.length) {
          message.push('----------------------');
        }
        if (index === res.length - 1) {
          message.push(`合計損益: ${sumPnl} 円`);
        }
      });
    } else {
      message.push('建玉がありません');
    }
    message.push('----------------------');
    deferred.resolve(message);
  });

  return deferred.promise;
};


getChildOrders();
getPositions();

const sendChildOrder = (params) => {
  const { side, size, price, type } = params;
  const body = JSON.stringify({
    product_code: API_PARAMS.PRODUCT_CODE,
    child_order_type: type || 'MARKET',
    side,
    size,
    price,
    minute_to_expire: 10000,
    time_in_force:'GTC',
  });

  const deferred = q.defer();
  apiRequest('POST', 'me/sendchildorder', body, (err, response, payload) => {
    const res = JSON.parse(payload);
    const message = [];
    message.push('-------注文結果-------');
    console.log('-------注文結果-------');

    console.log(`注文ID: ${res.child_order_acceptance_id}`);
    console.log(`数量: ${size}`);
    console.log(`指値価格: ${price}`);
    console.log(`売買: ${side}`);
    message.push(`注文ID: ${res.child_order_acceptance_id}`);
    message.push(`数量: ${size}`);
    message.push(`指値価格: ${price}`);
    message.push(`売買: ${side}`);
    console.log('----------------------');
    message.push('----------------------');
    deferred.resolve(message);
  });
  return deferred.promise;
};

// sendChildOrder('BUY', '0.001', '1400000');

const cancelChildOrder = (side, size, price) => {
  const body = JSON.stringify({
    product_code: API_PARAMS.PRODUCT_CODE,
    child_order_type: 'LIMIT',
    side,
    size,
    price,
    minute_to_expire: 10000,
    time_in_force:'GTC',
  });
  apiRequest('POST', 'me/cancelchildorder', body, (err, response, payload) => {
    console.log('-------注文結果--------');
    const res = JSON.parse(payload);
    console.log(`注文ID : ${res.child_order_acceptance_id}`);
    console.log(`数量 : ${size}`);
    console.log(`指値価格 : ${price}`);
    console.log(`売り買い :${side}`);
    console.log('----------------------');
  });
};

export const order = {
  getChildOrders,
  getPositions,
  sendChildOrder,
  cancelChildOrder
};
