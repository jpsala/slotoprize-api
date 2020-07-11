/* eslint-disable babel/no-unused-expressions */
import * as httpStatusCodes from 'http-status-codes'
import createError from 'http-errors'
import {createConnection, ResultSetHeader} from 'mysql2/promise'
import camelcaseKeys from 'camelcase-keys'
import {pickProps} from '../../helpers'

const log = false
export default function getConnection(host = 'localhost'): Promise<any> {
  const config = {
    host,
    user: 'jpsala',
    password: 'lani0363',
    database: 'meta',
    charset: 'utf8mb4',
    debug: false,
    waitForConnections: false,
    multipleStatements: true,
  }
  return createConnection(config)
}
export const queryOneMeta = async (select: string, params: any = [], camelCase = false, fields: string[] | undefined = undefined): Promise<any> => {
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
    await conn.destroy()
  }
}
export const queryMeta = async (select: string, params: any = [], camelCase = false, fields: string[] | undefined = undefined): Promise<any[]> => {
  log && console.log('query', select, params)
  const conn = await getConnection()
  try {
    let response
    const [results] = await conn.query(select, params)
    if (fields && results && results.length > 0)
      response = results.map((row) => pickProps(row, fields))
    else response = camelCase ? camelcaseKeys(results) : results
    return response
  } catch (err) {
    console.error(err.message)
    throw createError(httpStatusCodes.INTERNAL_SERVER_ERROR, err)
  } finally {
    await conn.destroy()
  }
}
export const execMeta = async (select: string, params: any = []): Promise<ResultSetHeader> => {
  log && console.log('query', select, params)
  const conn = await getConnection()
  try {
    const [respExec] = await conn.query(select, params)
    return respExec as ResultSetHeader
  } catch (err) {
    console.error(err.message)
    throw createError(httpStatusCodes.INTERNAL_SERVER_ERROR, err)
  } finally {
    await conn.destroy()
  }
}
