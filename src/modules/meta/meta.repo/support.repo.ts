/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// #region imports
import createError from 'http-errors'
import { BAD_REQUEST } from 'http-status-codes'
import { queryExec, query } from '../../../db'
import { sendMail } from '../meta-services/email.service'
import { getSetting, setSetting } from './../../slot/slot.services/settings.service'

// #endregion

export async function postSupportAdminForCrud(body: any): Promise<any>{
  console.log('body', body)
  if(body.email) await setSetting('emailSupport', body.email)
  if(body.request) delete body.request.createdAt
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  if(body.request) await queryExec(`update support_request set ? where id = ${body.request.id}`, body.request)
  return {status: 'ok'}
}
export async function supportAdminForCrud(): Promise<any>{
  const email = await getSetting('emailSupport', 'support@tagadagame.com')
  const requests = await query(`select * from support_request order by id desc`)
  return {email, requests}
}
export async function getSupportRequestForCrud(userId: string): Promise<any>{
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return await query(`select * from support_request where userId = ${userId} order by id desc`)
}
export async function setSoporte(userId: number, body: any): Promise<any> {
  if(body?.email === "" || body?.message === "" || body?.name === "") throw createError(BAD_REQUEST, 'Missing or empty fields')
  body.userId = userId
  delete body.sessionToken
  await queryExec(`insert into support_request set ?`, body)
  const emailSupport = await getSetting('emailSupport', 'jpsala+support@gmail.com')
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  const subject = `Support request from user with id ${userId}, and email ${body.email}`
  console.log('body', body)
  const mail = await sendMail(emailSupport, subject, body.message, body.email )
  console.log('mail', mail)
  delete body.message
  return body
}


