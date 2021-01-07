/* eslint-disable babel/no-unused-expressions */
import { hostname } from 'os'
import {createConnection, ResultSetHeader, Connection} from 'mysql2/promise'
import camelcaseKeys from 'camelcase-keys'
const log = false
let dbHost
if(hostname() === 'jpnote') dbHost = 'localhost'
else if(hostname() === 'sloto-dev') dbHost = 'slotoprizesdev.cdy8hosrrn6a.eu-west-3.rds.amazonaws.com'
else if(hostname() === 'slotoprizes') dbHost = 'slotoprizeslive.cdy8hosrrn6a.eu-west-3.rds.amazonaws.com'

const userName = 'admin'
const dbName = 'slotoprizes'
const password = 'lani0363'
export default function getConnection(host = dbHost): Promise<Connection> {
  // eslint-disable-next-line no-process-env
  const config = {
    // connectionLimit: 10,
    host,
    user: userName,
    password: password,
    database: dbName,
    debug: false,
    charset: 'utf8mb4',
    // waitForConnections: true,
    multipleStatements: true,
  }
  return createConnection(config)
}
export const queryGetEmpty = async (query: string, camelCase = false): Promise<any> => {
  log && console.log('queryGetEmpty', query)
  const conn = await getConnection()
  const emptySet = {}
  try {
    const [_, fields] = await conn.query(query)
    for (const field of <any>fields) 
      switch (field.columnType) {
        case 3:
          emptySet[field.name] = String(field.name).toLocaleLowerCase() === 'id' ? -1 : 0
          break
        case 253:
        case 252:
          emptySet[field.name] = ''
          break
        case 12:
          emptySet[field.name] = ''
          break
        default:
          console.log('queryGetEmpty unknown field type', field.name, field.columnType)
          emptySet[field.name] = `${field.columnType as number} not known`
          break
      }
    
    return camelCase ? camelcaseKeys(emptySet) : emptySet
  } catch (err) {
    console.error('queryExec error: select %O, error %O', query, err)
    throw Object.assign({}, err, {data: {query}})
  } finally {
    conn.destroy()
  }
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
    console.error('queryExec error: select %O, params %O, error %O', query, params, err)
    throw Object.assign({}, err, {data: {query, params}})
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
  } catch(error) {
    console.error('query error: select %O, params %O, error %O', select, params, error)
    throw Object.assign({}, error, {data: {select, params}})
  } finally {
    conn.destroy()
  }
}
export const queryScalar = async (select: string, params: any = []): Promise<string | undefined> => {
try {
    const resp = await queryOne(select, params)
    if(!resp || Object.getOwnPropertyNames(resp).length === 0) return undefined
    return resp[Object.getOwnPropertyNames(resp)[0]] as string
} catch (err) {
  console.error('queryScalar error: select %O, params %O, error %O', select, params, err)
  throw Object.assign({}, err, {data: {select, params}})
}
}
export const queryExec = async (select: string, params: any = []): Promise<ResultSetHeader> => {
  const conn = await getConnection()
  const stmt = conn.format(select, params)
  log && console.log('queryExec', stmt)
  try
  {
    const [respExec] = await conn.query(stmt) as ResultSetHeader[]
    return respExec
  }catch (err)
  {
    console.error('queryExec error: %O, params %O, error %O', select, params, err)
    throw Object.assign({}, err, {data: {select}})
  } finally {
    conn.destroy()
  }
}

/*

export const queryExec = async (select: string, params: any = []): Promise<ResultSetHeader> => {
  console.log('queryExec select', select)
  if(!select)
    throw Error('queryExec: select can not be empty', select)
  
  const conn = await getConnection()
  const select = params ? conn.format(select, params) : select
  console.log('select', select)
  try {
    const [respExec] = await conn.query(select) as ResultSetHeader[]
    return respExec
  }catch (err){
    console.error('Error in queryExec', err.trace)
    throw Object.assign(err, {sql: select})
  } finally {
    conn.destroy()
  }
}
*/