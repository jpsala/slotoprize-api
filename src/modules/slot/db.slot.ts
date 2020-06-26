/* eslint-disable babel/no-unused-expressions */
import * as httpStatusCodes from 'http-status-codes'
import createError from 'http-errors'
import {createPool} from 'mysql2/promise'

const pool = []
let acquiredConnections = 0
let queueSize = 0
let poolSize = 0
const log = false
export default async function getConnection(host: string = 'localhost'): Promise<any> {
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
  log && console.warn('Get new connection for ', host, pool)
  // eslint-disable-next-line require-atomic-updates
  pool[host] = await createPool(config)
  pool[host].on('acquire', () => {
    acquiredConnections += 1
    log && console.info('db slot: acquire', acquiredConnections)
    if (acquiredConnections > 2) { console.warn('db slot: verify cant of connections maybe a release is missing', acquiredConnections) }
    if (acquiredConnections > 5) { console.error('db slot: verify cant of connections maybe a release is missing', acquiredConnections) }
  })
  pool[host].on('connection', () => {
    poolSize += 1
    log && console.info('db slot: connector.DBConnection.connection', {poolSize, host})
  })
  pool[host].on('enqueue', () => {
    queueSize += 1
        // export more Prometheus metrics...
    console.error('db slot: Connection pool is waiting for a connection, posibly a release is missing', acquiredConnections)
    console.info('db slot: connector.DBConnection.enqueue', {queueSize})
  })
  pool[host].on('release', () => {
    acquiredConnections -= 1
    log && console.info('db slot:release', acquiredConnections)
  })
  return pool[host].getConnection()
}
export const queryOne = async (query: string, params: any = []): Promise<any> => {
  console.log('queryOne', query)
  const conn = await getConnection()
  try {
    const [result] = await conn.query(query, params)
    return result.length > 0 ? result[0] : undefined
  } catch (err) {
    console.error(err.message)
    throw createError(httpStatusCodes.INTERNAL_SERVER_ERROR, err)
  } finally {
    await conn.release()
  }
}
// eslint-disable-next-line require-await
export const exec = async (query: string, params: any = []): Promise<any> => {
  console.log('exec', query)
  return queryOne(query, params)
}
