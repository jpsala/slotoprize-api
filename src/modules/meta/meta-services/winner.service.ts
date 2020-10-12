import { exec, query } from "../../../db"
import { getGameUserByDeviceId } from "../meta.repo/gameUser.repo"

/* date, prize, origin, status, useId, user */
export async function getWinnersForCrud(): Promise<any> {
  const select = `
    select jw.id, gu.device_id,
        if(last_name != '', concat(last_name, ', ', first_name), 'No name in Profile') as user,
        if(gu.email != '', gu.email, 'No Email in Profile')          as email,
        date_format(jw.createdAt, '%Y-%m-%d')                        as date,
        'Jackpot'                                                    as origin,
        jw.state                                                     as state,
        j.prize                                                      as prize,
        gu.id                                                        as userId
    from jackpot_win jw
        inner join jackpot j on jw.jackpot_id = j.id
        inner join game_user gu on jw.game_user_id = gu.id
    where jw.createdAT
        union
    select r.id, gu.device_id,
        if(last_name != '', concat(last_name, ', ', first_name), '') as user,
        if(gu.email != '', gu.email, 'n/a')                          as email,
        date_format(rh.closing_date, '%Y-%m-%d')                     as date,
        'Raffle'                                                     as origin,
        r.state                                                      as state,
        if(rl.id, concat(rl.name,' | ',rl.description), 'No localization data for this raffle')          as prize,
        gu.id                                                        as userId
      from raffle_wins rw
        inner join raffle_history rh on rw.raffle_history_id = rh.id
        inner join raffle r on rh.raffle_id = r.id
        inner join game_user gu on r.winner = gu.id
        left join raffle_localization rl on r.id = rl.raffle_id and rl.language_code = 'fr-FR'
      where rh.closing_date
  order by 5 desc
`
const data = await query(select)
  for (const row of data) 
    row.player = await getGameUserByDeviceId(row.device_id)
  
  return data
}
export const postWinnersStatusForCrud = async (items: any[], state: string ): Promise<any> => {
  console.log('items', items)
  for (const item of items) 
    if (item.origin === 'Jackpot') 
      await exec(`update jackpot_win set state = '${state}' where id = ${<number>item.id}`)  
    else
      await exec(`update raffle set state = '${state}' where id = ${<number>item.id}`)  
}