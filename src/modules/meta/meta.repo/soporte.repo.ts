// import createError from 'http-errors'
import {exec} from '../../../db'

export async function setSoporte(userId: number, body: any): Promise<any> {
  body.userId = userId
  delete body.sessionToken
  const response = await exec(`
    insert into support_request set ?
  `, body)
  delete body.message
  return body
}

