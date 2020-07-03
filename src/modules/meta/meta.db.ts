/* eslint-disable babel/no-unused-expressions */
import * as httpStatusCodes from 'http-status-codes'
import createError from 'http-errors'
import {createPool, ResultSetHeader} from 'mysql2/promise'
import camelcaseKeys from 'camelcase-keys'
import {pickProps} from '../../helpers'

const pool = []
let acquiredConnections = 0
let queueSize = 0
let poolSize = 0
const log = false
export default async function getConnection(host = 'localhost'): Promise<any> {
  if (pool[host]) return pool[host].getConnection()
  const config = {
    connectionLimit: 10,
    host,
    user: 'jpsala',
    password: 'lani0363',
    database: 'meta',
    debug: false,
    waitForConnections: true,
    multipleStatements: true,
  }
  log && console.warn('Get new connection for ', host, pool)
  // eslint-disable-next-line require-atomic-updates
  pool[host] = await createPool(config)
  pool[host].on('acquire', () => {
    acquiredConnections += 1
    log && console.info('db meta: acquire', acquiredConnections)
    if (acquiredConnections > 2) { console.warn('db meta: verify cant of connections maybe a release is missing', acquiredConnections) }
    if (acquiredConnections > 5) { console.error('db meta: verify cant of connections maybe a release is missing', acquiredConnections) }
  })
  pool[host].on('connection', () => {
    poolSize += 1
    log && console.info('db meta: connector.DBConnection.connection', {poolSize, host})
  })
  pool[host].on('enqueue', () => {
    queueSize += 1
        // export more Prometheus metrics...
    console.error('db meta: Connection pool is waiting for a connection, posibly a release is missing', acquiredConnections)
    console.info('db meta: connector.DBConnection.enqueue', {queueSize})
  })
  pool[host].on('release', () => {
    acquiredConnections -= 1
    log && console.info('db meta:release', acquiredConnections)
  })
  return pool[host].getConnection()
}
export const queryOne = async (select: string, params: any = [], camelCase = false, fields: string[] | undefined = undefined): Promise<any> => {
  log && console.log('queryOne', select, params)
  const conn = await getConnection()
  try {
    const [result] = await conn.query(select, params)
    let response = result[0]
    if (response) {
      response = fields ? pickProps(response, fields) : response
      response = camelCase ? camelcaseKeys(response) : response
    }
    return response
  } catch (err) {
    console.error(err.message)
    throw createError(httpStatusCodes.INTERNAL_SERVER_ERROR, err)
  } finally {
    await conn.release()
  }
}
export const query = async (select: string, params: any = [], camelCase = false, fields: string[] | undefined = undefined): Promise<any[]> => {
  log && console.log('query', select, params)
  const conn = await getConnection()
  try {
    let response
    const [results] = await conn.query(select, params)
    if (fields && results && results.length > 0) {
      response = results.map((row) => pickProps(row, fields))
    } else { response = camelCase ? camelcaseKeys(results) : results }
    return response
  } catch (err) {
    console.error(err.message)
    throw createError(httpStatusCodes.INTERNAL_SERVER_ERROR, err)
  } finally {
    await conn.release()
  }
}
export const exec = async (select: string, params: any = []): Promise<ResultSetHeader> => {
  log && console.log('query', select, params)
  const conn = await getConnection()
  try {
    const [respExec] = await conn.query(select, params)
    return respExec as ResultSetHeader
  } catch (err) {
    console.error(err.message)
    throw createError(httpStatusCodes.INTERNAL_SERVER_ERROR, err)
  } finally {
    await conn.release()
  }
}
