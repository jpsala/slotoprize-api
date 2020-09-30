/* eslint-disable @typescript-eslint/no-unsafe-return */
import { query } from "../../../db"
import { getGameUserByDeviceId } from "../meta.repo/gameUser.repo"


export async function getWinnersForCrud(): Promise<any> {
  const select = `
    ( select gu.device_id,
          if(last_name != '', concat(last_name, ', ', first_name), '') as user,
          if(gu.email != '', gu.email, 'n/a')                          as email,
          'Jackpot'                                                    as origin,
          jw.state,
          date_format(jw.createdAt, '%d-%m-%Y')                        as date,
          j.prize
      from jackpot_win jw
            inner join jackpot j on jw.jackpot_id = j.id
            inner join game_user gu on jw.game_user_id = gu.id
      union
      select gu.device_id,
          if(last_name != '', concat(last_name, ', ', first_name), '') as user,
          if(gu.email != '', gu.email, 'n/a')                          as email,
          date_format(rh.closing_date, '%d-%m-%Y')                     as date,
          if(rl.id, rl.name, '')                                       as name,
          if(rl.id, rl.description, '')                                as description,
          r.state
      from raffle_wins rw
            inner join raffle_history rh on rw.raffle_history_id = rh.id
            inner join raffle r on rh.raffle_id = r.id
            inner join game_user gu on r.winner = gu.id
            left join raffle_localization rl on r.id = rl.raffle_id and rl.language_code = gu.language_code
      ) order by 6
  `
  const data = await query(select)
  for (const row of data) 
    row.player = await getGameUserByDeviceId(row.device_id)
  
  return data
}