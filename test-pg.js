const { Client } = require('pg');
const client = new Client({
  host: '127.0.0.1',
  port: 5434,
  user: 'postgres',
  password: 'postgres',
  database: 'scholars_tea',
  timeout: 15000
});

console.log('Starting connection...');
console.log('Host: 127.0.0.1:5434 -> proxy -> 172.28.45.130:5432 (PostgreSQL)');

client.connect()
  .then(() => {
    console.log('Connected!');
    return client.query('SELECT 1 as test');
  })
  .then(r => {
    console.log('Query result:', r.rows);
    client.end();
    process.exit(0);
  })
  .catch(e => {
    console.error('Error:', e.message);
    process.exit(1);
  });

setTimeout(() => {
  console.log('Timeout reached - exiting');
  process.exit(1);
}, 15000);