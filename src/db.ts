/* eslint-disable babel/no-unused-expressions */
import {createConnection, ResultSetHeader, Connection} from 'mysql2/promise'
import * as httpStatusCodes from 'http-status-codes'
import createError from 'http-errors'

import camelcaseKeys from 'camelcase-keys'
const log = false
export default function getConnection(host = 'localhost'): Promise<Connection> {
  // eslint-disable-next-line no-process-env
  const environment = process.env.NODE_ENV || 'development'
  const config = {
    // connectionLimit: 10,
    host,
    user: 'jpsala',
    password: 'lani0363',
    database: environment === 'XXtesting' ? 'wopitest' : 'wopidom',
    debug: false,
    charset: 'utf8mb4',
    // waitForConnections: true,
    multipleStatements: true,
  }
  return createConnection(config)
}
export const queryOne = async (query: string, params: any = [], camelCase = false): Promise<any> => {
  log && console.log('queryOne', query)
  const conn = await getConnection()
  try {
    const [result] = await conn.query(query, params)
    const response = camelCase ? camelcaseKeys(result[0]) : result[0]
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return response
  } catch (err) {
    console.error(err.message)
    throw createError(httpStatusCodes.INTERNAL_SERVER_ERROR, err)
  } finally {
    conn.destroy()
  }
}
export const query = async (select: string, params: string[] = [], camelCase = false): Promise<any[]> => {
  log && console.log('query', select)
  const conn = await getConnection()
  try {
    const [results] = (await conn.query(select, params)) as any[]
    const response = camelCase ? camelcaseKeys(results) : results
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return response
  } finally {
    conn.destroy()
  }
}
export const queryExec = async (select: string, params: any = []): Promise<ResultSetHeader> => {
  const conn = await getConnection()
  try
  {
    const [respExec] = await conn.query(select, params) as ResultSetHeader[]
    return respExec
  }catch (err)
    {
    console.dir(err)
    throw err
  } finally {
    conn.destroy()
  }
}

