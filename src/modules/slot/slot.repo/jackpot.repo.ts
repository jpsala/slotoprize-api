import { urlBase } from './../../../helpers'
import { PrizeWinners } from './../slot.services/prizes.service'
import { GameUser } from './../../meta/meta.types'
import { query, queryOne, queryExec } from './../../../db'
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

export const getJackpotWinners = async (): Promise<PrizeWinners[]> =>
{
  const url = urlBase()
  const data = await query(`
    (select concat(gu.first_name, ', ', gu.last_name) as winnerName,
      jw.createdAt as date, '${url}/img/jackpotPrize.png' as textureUrl, 'Jackpot' as prizeName
    from jackpot_win jw
        inner join game_user gu on jw.game_user_id = gu.id
        inner join jackpot j on jw.jackpot_id = j.id
    where jw.createdAt
    and gu.first_name != ''
    and gu.last_name != ''
    order by jw.id desc
    limit 10
    ) order by 3 asc
  `)
  return data as PrizeWinners[]
}
export async function getJackpotRow(id: number): Promise<JackpotData | undefined>
{
  const data = <JackpotData> (await queryOne(`select * from jackpot where id = ${id}`))
  return data
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
    String(user.id), String(jackpotLiveRow.id), 'won'
  ])
}
export async function cleanLive(data: JackpotData): Promise<JackpotData>
{
  data.spinCount = 0
  data.repeated++
  await queryExec(`update jackpot set spinCount=0, repeated=repeated+1 where id = ?`, [data.id])
  return data
}
export async function updateJackpotNextRow(data: JackpotData): Promise<number>{
  const resp = await queryExec(`update jackpot set ? where id = ${<number>data.id}`, data)
  return resp.affectedRows
}
export async function addJackpotNextRow(data: JackpotData): Promise<number>
{
  const resp = await queryExec(`insert into jackpot set ?`, data)
  return resp.insertId
}
export async function getJackpotLiveRow(): Promise<JackpotData | undefined>
{
  const data = <JackpotData>(await queryOne(`select * from jackpot where state = "live"`))
  return data
}
export const changeState = async (jackpotRow: JackpotData, state: JackpotState): Promise<JackpotData> =>
{
  await queryExec(`update jackpot set state = '${state}' where id = ${jackpotRow.id as number}`)
  jackpotRow.state = state
  return jackpotRow
}