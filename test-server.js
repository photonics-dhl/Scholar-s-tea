const net = require('net');
const server = net.createServer((socket) => {
  console.log('Client connected from Windows');
  socket.end('PostgreSQL mock\n');
});
server.listen(5432, '0.0.0.0', () => {
  console.log('TCP server listening on 0.0.0.0:5432');
});