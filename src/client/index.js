'use strict';

const _ = require('lodash');
const axios = require('axios');
const moment = require('moment-timezone');
const io = require('socket.io-client');

const executionsData = {
  midPrice: 0,
  executions: [],
  ltp: 0
};

const socket = io('localhost:8000');
socket.on('executions', ({ executions }) => {
  _.forEach(executions, (m) => {
    executionsData.executions.unshift(m);
  });
  //直近180件格納（件数は適当）
  executionsData.executions.splice(180);
});

socket.on('ltp', ({ ltp }) => {
  executionsData.ltp = ltp;
});

const getBalance = () => {
  const url = '/balance';
  const method = 'GET';
  const transformResponse = [
    (res) => {
      try {
        return JSON.parse(res);
      } catch(e) {
        console.log(`${url} - API Response が不正です`);
        console.log(res);
        new TypeError('Response data is not JSON.');
      }
    }
  ];
  const options = {
    url,
    method,
    transformResponse
  };

  return axios(options);
};

const getCollateral = () => {
  const url = '/collateral';
  const method = 'GET';
  const transformResponse = [
    (res) => {
      try {
        return JSON.parse(res);
      } catch(e) {
        console.log(`${url} - API Response が不正です`);
        console.log(res);
        new TypeError('Response data is not JSON.');
      }
    }
  ];
  const options = {
    url,
    method,
    transformResponse
  };

  axios(options).then((res) => {
    const { data } = res;
    collateral.$data.collateral = data.collateral;
    collateral.$data.open_position_pnl = data.open_position_pnl;
    collateral.$data.require_collateral = data.require_collateral;
    collateral.$data.keep_rate = (data.keep_rate * 100).toFixed(2);
  });
};


var data = {
  isShown: false
};
var app2 = new Vue({
  el: '#buttons',
  data,
  methods: {
    balance: function () {
      getBalance();
    },
    collateral: function () {
      getCollateral();
    }
  }
});

var execution = new Vue({
  el: '#execution',
  data: {
    executions: executionsData.executions
  }
});

var lowPrice = new Vue({
  el: '#low-price',
  data: {
    price: 0
  }
});

var highPrice = new Vue({
  el: '#high-price',
  data: {
    price: 0
  }
});

var diffPrice = new Vue({
  el: '#diff-price',
  data: {
    price: 0
  }
});

var ltpPrice = new Vue({
  el: '#ltp-price',
  data: {
    price: 0
  }
});

var collateral = new Vue({
  el: '#collateral',
  data: {
    collateral: 0,
    open_position_pnl: 0,
    require_collateral: 0,
    keep_rate: 0
  }
});

setInterval(() => {
  const firstExecutions = _.head(executionsData.executions);
  if (!firstExecutions) {
    return;
  }
  const latestDate = moment(firstExecutions.execDate);
  const lastDate = latestDate.clone().add(-3, 's');
  const latestExecutions = _.filter(executionsData.executions, (execution) => {
    return moment(execution.execDate).isSameOrAfter(lastDate);
  });
  const min = _.minBy(latestExecutions, (execution) => {
    return execution.price;
  });
  const max = _.maxBy(latestExecutions, (execution) => {
    return execution.price;
  });
  lowPrice.$data.price = min.price;
  highPrice.$data.price = max.price;
  diffPrice.$data.price = max.price - min.price;
  ltpPrice.$data.price = executionsData.ltp;
}, 100);
