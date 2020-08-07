import {BAD_REQUEST} from 'http-status-codes'
import createError from 'http-errors'

import { query, exec } from './../../../db'

export async function getSupportRequestForCrud(userId: string): Promise<any>
{
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return await query(`select * from support_request where userId = ${userId}`)
}
export async function setSoporte(userId: number, body: any): Promise<any> {
  if(body?.email === "" || body?.message === "" || body?.name === "") throw createError(BAD_REQUEST, 'Missing or empty fields')
  body.userId = userId
  delete body.sessionToken
  await exec(`
    insert into support_request set ?
  `, body)
  delete body.message
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return body
}


