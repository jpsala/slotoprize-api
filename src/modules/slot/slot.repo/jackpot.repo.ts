import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from 'http-status-codes'
import createHttpError from 'http-errors'
import { query, queryOne, exec } from './../../../db'
import { GameUser } from '@/modules/meta/meta.types'
// import * as thisModule from './jackpot.repo'
export type JackpotState = 'next' | 'live' | 'past'
export type JackpotData = {
  id?: number;
  cycle: number;
  prize: number;
  state: JackpotState;
  repeated: number;
  spinCount: number;
  confirmed: boolean;
}
export async function getJackpotData(): Promise<JackpotData[] | undefined>
{
  const data = <JackpotData[]> (await query(`select * from jackpot`))
  return data
}
export async function getJackpotNextRow(): Promise<JackpotData|undefined>
{
  const data = await queryOne(`select * from jackpot where state = 'next'`)
  return <JackpotData> data
}
export async function addSpinsToJackpotLiveRow(amount: number): Promise<void>
{
  await query(`update jackpot set spinCount = spinCount + ? where state = 'live'`, [String(amount)])
}
export async function setJackpotWinned(user: GameUser, jackpotLiveRow: JackpotData): Promise<void>
{
  await query(`insert into jackpot_win(game_user_id, jackpot_id, state) values (?, ?, ?)`, [
    String(user.id), String(jackpotLiveRow.id), 'new'
  ])
}
export async function cleanLive(data: JackpotData): Promise<JackpotData>
{
  data.spinCount = 0
  data.repeated++
  await exec(`update jackpot set spinCount=0, repeated=repeated+1 where id = ?`, [data.id])
  return data
}
export async function addJackpotNextRow(data: JackpotData): Promise<void>
{
  await exec(`insert into jackpot set ?`, data)
}
export async function getJackpotLiveRow(): Promise<JackpotData | undefined>
{
  const data = <JackpotData>(await queryOne(`select * from jackpot where state = "live"`))
  return data
}
export const changeState = async (jackpotRow: JackpotData, state: JackpotState): Promise<JackpotData> =>
{
  await exec(`update jackpot set state = '${state}' where id = ${jackpotRow.id as number}`)
  jackpotRow.state = state
  return jackpotRow
}