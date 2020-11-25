/* eslint-disable babel/no-unused-expressions */
import { hostname } from 'os'
import {createConnection, ResultSetHeader, Connection} from 'mysql2/promise'
import * as httpStatusCodes from 'http-status-codes'
import createError from 'http-errors'

import camelcaseKeys from 'camelcase-keys'
const log = false
console.log('xx', hostname())
const hostDefault = hostname() === 'jpnote' ? 'localhost' : 'slotoprizes.cdy8hosrrn6a.eu-west-3.rds.amazonaws.com'
const userName = hostname() === 'jpnote' ? 'jpsala' : 'admin'
const dbName = hostname() === 'jpnote' ? 'wopidom' : 'slotoprizes'
export default function getConnection(host = hostDefault): Promise<Connection> {
  // eslint-disable-next-line no-process-env
  const config = {
    // connectionLimit: 10,
    host,
    user: userName,
    password: 'lani0363',
    database: dbName,
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
export const queryScalar = async (select: string, params: any = []): Promise<string | undefined> => {
  const resp = await queryOne(select, params)
  if(!resp || Object.getOwnPropertyNames(resp).length === 0) return undefined
  return resp[Object.getOwnPropertyNames(resp)[0]] as string
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

