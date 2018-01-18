import http from 'http';
import app from './main';
import socket from './socket';
import { shared } from './shared';

const port = process.env.PORT || 8081;
app.set('port', port);

const server = http.createServer(app);

server.timeout = 1000 * 500;

server.listen(port);

shared.io = socket();

process.on('uncaughtException', (err) => {
  console.log(err);
});

module.exports = server;
