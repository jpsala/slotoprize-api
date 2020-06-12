import { createPool } from 'mysql2/promise';

const pool = [];
export default function getPool(host = 'localhost') {
  if (pool[host]) {
    console.log(`db, host ${host}`);
    return pool[host];
  }
  console.log(`db, host ${host} 1ra. vez`);
  const config = {
    connectionLimit: 100,
    host,
    user: 'root',
    password: 'lani0363',
    database: 'iae-nuevo',
    debug: false,
    waitForConnections: true,
    multipleStatements: true,
  };
  pool[host] = createPool(config);
  return pool[host];
}
/*
connectionLimit: 100,
    host: 'localhost',
    user: 'root',
    password: 'lani0363',
    database: 'iae-nuevo',
    debug: false,
    waitForConnections: true,
    multipleStatements: true,
*/
