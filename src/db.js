const mysql = require('mysql2/promise');

let pool;
module.exports = function db() {
  if (pool) {
    return pool;
  }
  const config = {
    connectionLimit: 100,
    host: 'localhost',
    user: 'root',
    password: 'lani0363',
    database: 'iae-nuevo',
    debug: false,
    waitForConnections: true,
    multipleStatements: true,
  };
  return mysql.createPool(config);
};
