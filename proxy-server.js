const net = require('net');

const LISTEN_PORT = 5434;
const DEST_HOST = '172.28.45.130';
const DEST_PORT = 5432;

const server = net.createServer((clientSocket) => {
  console.log('Client connected from:', clientSocket.remoteAddress, 'port', clientSocket.remotePort);

  // Set up error handlers
  clientSocket.on('error', (err) => {
    console.error('Client socket error:', err.message);
  });

  clientSocket.on('close', () => {
    console.log('Client disconnected');
  });

  const proxySocket = net.createConnection({
    host: DEST_HOST,
    port: DEST_PORT,
    timeout: 10000
  });

  proxySocket.on('connect', () => {
    console.log('Connected to PostgreSQL at', DEST_HOST + ':' + DEST_PORT);
    console.log('Starting proxy...');

    // Start piping
    clientSocket.pipe(proxySocket);
    proxySocket.pipe(clientSocket);
  });

  proxySocket.on('timeout', () => {
    console.error('Proxy socket timeout');
    proxySocket.destroy();
    clientSocket.destroy();
  });

  proxySocket.on('error', (err) => {
    console.error('Proxy to PostgreSQL error:', err.message);
    clientSocket.destroy();
  });

  proxySocket.on('close', () => {
    console.log('PostgreSQL connection closed');
  });

  // Handle data from client before proxy connects
  clientSocket.on('data', (data) => {
    console.log('Data from client:', data.length, 'bytes');
    if (!proxySocket.writable) {
      console.log('Proxy socket not ready yet, buffering...');
    }
  });

  // Handle data from PostgreSQL
  proxySocket.on('data', (data) => {
    console.log('Data from PostgreSQL:', data.length, 'bytes');
  });
});

server.on('error', (err) => {
  console.error('Server error:', err.message);
  process.exit(1);
});

server.listen(LISTEN_PORT, '127.0.0.1', () => {
  console.log(`TCP proxy listening on 127.0.0.1:${LISTEN_PORT}`);
  console.log(`Forwarding to ${DEST_HOST}:${DEST_PORT}`);
});