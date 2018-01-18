import Nightmare from 'nightmare';
import q from 'q';
import { shared } from '../shared';

var nightmare = new Nightmare({
  show: false
});

let interval = null;
/**
 * いなごフライヤーからsellVolumeとbuyVolumeを取得する
 * @returns {Promise}
 */
const getSellBuyVolume = () => {
  const deferred = q.defer();
  nightmare
    .goto('https://inagoflyer.appspot.com/btcmac')
    .evaluate(() => {
      const time = new Date().getTime(); // UNIX ms timestamp.
      const sellVolume = document.querySelector('#sellVolumePerMeasurementTime').innerText;
      const buyVolume = document.querySelector('#buyVolumePerMeasurementTime').innerText;

      return {
        time,
        sellVolume,
        buyVolume
      };
    })
    .then((res) => {
      deferred.resolve(res);
    })
    .catch((err) => {
      console.log(err);
      deferred.reject(err);
    });

  return deferred.promise;
};

const subscribeInagoValue = () => {
  if (shared.status.subscribeInagoFlyer) {
    return Promise.reject('Already subscribed.');
  }

  console.log('Start inagoFlyer scraping.');
  shared.status.subscribeInagoFlyer = true;

  interval = setInterval(() => {
    getSellBuyVolume().then((res) => {
      if (shared.inagoData.power.length >= 5) {
        shared.inagoData.filled = true;
        shared.inagoData.power.shift();
      }
      shared.inagoData.power.push(res);
    })
  }, 5000);

  return Promise.resolve('Subscribe inagoFlyer.');
}

const unsubscribeInagoValue = () => {
  if (!shared.status.subscribeInagoFlyer) {
    return Promise.reject('Already unsubscribed.');
  }
  console.log('Stop inagoFlyer scraping.');
  shared.status.subscribeInagoFlyer = false;

  clearInterval(interval);
  shared.inagoData.power = [];
  shared.inagoData.filled = false;
  return Promise.resolve('Unsubscribe inagoFlyer.');
}

export const scraping = {
  subscribeInagoValue,
  unsubscribeInagoValue
}
