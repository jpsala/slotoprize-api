import {BAD_REQUEST} from 'http-status-codes'
import createError from 'http-errors'

import { query, exec } from '../../../db'
import { getSetting, setSetting } from './../../slot/slot.services/settings.service'

export async function postSupportAdminForCrud(body: any): Promise<any>
{
  console.log('body', body)
  if(body.email) await setSetting('emailSupport', body.email)
  if(body.request) delete body.request.createdAt
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  if(body.request) await exec(`update support_request set ? where id = ${body.request.id}`, body.request)
  return {status: 'ok'}
}
export async function supportAdminForCrud(): Promise<any>
{
  const email = await getSetting('emailSupport', 'support@slotoprize.com')
  const requests = await query(`select * from support_request order by id desc`)
  return {email, requests}
}
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


