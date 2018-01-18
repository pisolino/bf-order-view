import _ from 'lodash';
import request from 'request';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { API_PARAMS } from '../const';

dotenv.config();

const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;

const apiRequest = (method, path, body = '', callback) => {
  const timestamp = Date.now().toString();
  const text = `${timestamp}${method}${API_PARAMS.API_VERSION}${path}${body}`;
  const sign = crypto.createHmac('sha256', API_SECRET).update(text).digest('hex');
  const url = `https://api.bitflyer.jp${API_PARAMS.API_VERSION}/${path}`;
  const options = {
    url: url,
    method: method,
    body: body,
    headers: {
      'ACCESS-KEY': API_KEY,
      'ACCESS-TIMESTAMP': timestamp,
      'ACCESS-SIGN': sign,
      'Content-Type': 'application/json'
    }
  };
  request(options, callback);
};

export {
  apiRequest
};
