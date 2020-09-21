import { GameUser } from './../../meta/meta.types'
import { query, queryOne, exec } from './../../../db'
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
export type JackpotWinners = { date: string, winnerName: string, textureUrl: string }
export const getJackpotWinners = async (): Promise<JackpotWinners[]> =>
{
  const data = await query(`
    select jw.createdAt as date, concat(gu.first_name, ', ', gu.last_name) as winnerName,
           'https://assets.slotoprizes.tagadagames.com/img/jackpotPrize.png' as textureUrl,
           'jackpot' as prizeName
    from jackpot_win jw
      inner join game_user gu on jw.game_user_id = gu.id
      inner join jackpot j on jw.jackpot_id = j.id
  `)
  return data as JackpotWinners[]
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