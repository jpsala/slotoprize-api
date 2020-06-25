import {createPool} from 'mysql2/promise'

const pool = []
let acquiredConnections = 0
let queueSize = 0
// let poolSize = 0;
export default function getConnection(host = 'localhost'): any {
  if (pool[host]) {
    return pool[host].getConnection()
  }
  const config = {
    connectionLimit: 10,
    host,
    user: 'jpsala',
    password: 'lani0363',
    database: 'slot',
    debug: false,
    waitForConnections: true,
    multipleStatements: true,
  }
  pool[host] = createPool(config)
  pool[host].on('acquire', () => {
    acquiredConnections += 1
    // console.info('db slot: acquire', acquiredConnections)
    if (acquiredConnections > 1) { console.warn('db slot: verify cant of connections maybe a release is missing', acquiredConnections) }
    if (acquiredConnections > 5) { console.error('db slot: verify cant of connections maybe a release is missing', acquiredConnections) }
  })
  pool[host].on('connection', () => {
        // poolSize += 1;
        // console.info('db slot: connector.DBConnection.connection', { poolSize, host });
  })
  pool[host].on('enqueue', () => {
    queueSize += 1
        // export more Prometheus metrics...
    console.error('db slot: Connection pool is waiting for a connection, posibly a release is missing', acquiredConnections)
    console.info('db slot: connector.DBConnection.enqueue', {queueSize})
  })
  pool[host].on('release', () => {
    acquiredConnections -= 1
    // console.info('db slot:release', acquiredConnections)
  })
  return pool[host].getConnection()
}
