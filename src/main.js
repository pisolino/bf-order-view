import express from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import _ from 'lodash';

import { market, status, order, scraping } from './request';
import { shared } from './shared';

const jsonParser = bodyParser.json({limit: '50mb'});

const app = express();
app.use(helmet());


const inagoData = {
  power: []
};

app.use(express.static(`${__dirname}/../public`));


app.get('/board', (req, res) => {
  res.type('text').end(`${JSON.stringify(shared.boardData)}\n`);
});

app.get('/executions', (req, res) => {
  res.type('text').end(`${JSON.stringify(market.generateOrderedExecutions())}\n`);
});

app.get('/status', (req, res) => {
  market.getBoardState().then((message) => {
    res.type('text').end(`${message.join('\n')}\n`);
  });
});

app.get('/balance', (req, res) => {
  status.getBalance().then((message) => {
    res.type('text').end(`${message.join('\n')}\n`);
  });
});

app.get('/collateral', (req, res) => {
  status.getCollateral().then((data) => {
    res.json(data);
  });
});

app.get('/collateralhistory', (req, res) => {
  status.getCollateralHistory(req).then((message) => {
    res.type('text').end(`${message.join('\n')}\n`);
  });
});

app.get('/orders', (req, res) => {
  order.getChildOrders().then((message) => {
    res.type('text').end(`${message.join('\n')}\n`);
  });
});

app.get('/positions', (req, res) => {
  order.getPositions().then((message) => {
    res.type('text').end(`${message.join('\n')}\n`);
  });
});

app.post('/order/buy', jsonParser, (req, res) => {
  order.sendChildOrder(_.assignIn(req.body, {'side': 'BUY'})).then((message) => {
    res.type('text').end(`${message.join('\n')}\n`);
  });
});

app.post('/order/buy/market', jsonParser, (req, res) => {
  order.sendChildOrder(_.assignIn(req.body, {'side': 'BUY', 'child_order_type': 'MARKET', 'price': 0})).then((message) => {
    res.type('text').end(`${message.join('\n')}\n`);
  });
});

app.post('/order/sell', jsonParser, (req, res) => {
  order.sendChildOrder(_.assignIn(req.body, {'side': 'SELL'})).then((message) => {
    res.type('text').end(`${message.join('\n')}\n`);
  });
});

app.post('/order/sell/market', jsonParser, (req, res) => {
  order.sendChildOrder(_.assignIn(req.body, {'side': 'SELL', 'child_order_type': 'MARKET', 'price': 0})).then((message) => {
    res.type('text').end(`${message.join('\n')}\n`);
  });
});

app.get('/inago/start', (req, res) => {
  scraping.subscribeInagoValue().then((message) => {
    res.type('text').end(`${message}\n`);
  }).catch((err) => {
    res.type('text').end(`${err}\n`);
  });
});

app.get('/inago/stop', (req, res) => {
  scraping.unsubscribeInagoValue().then((message) => {
    res.type('text').end(`${message}\n`);
  }).catch((err) => {
    res.type('text').end(`${err}\n`);
  });
});

export default app;
