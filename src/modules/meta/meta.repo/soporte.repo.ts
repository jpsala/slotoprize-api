import statusCodes from 'http-status-codes'
import createError from 'http-errors'

// import createError from 'http-errors'
import {exec} from '../../../db'

export async function setSoporte(userId: number, body: any): Promise<any> {
  if(body?.email === "" || body?.message === "" || body?.name === "") throw createError(statusCodes.BAD_REQUEST, 'Missing or empty fields')
  body.userId = userId
  delete body.sessionToken
  const response = await exec(`
    insert into support_request set ?
  `, body)
  delete body.message
  return body
}

