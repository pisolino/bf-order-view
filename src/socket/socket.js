import http from 'http';

const socket = () => {
  const server = http.createServer();
  const io = require('socket.io').listen(server);
  server.timeout = 1000 * 500;
  server.listen(8000);

  return io;
};


export default socket;
