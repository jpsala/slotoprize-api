import createError from 'http-errors'
import * as httpStatusCodes from "http-status-codes"
import * as metaService from '../meta/meta.service'
import getMetaConnection from '../meta/meta.db'
import runSpin from "./services/spin"
import getSlotConnection from './db.slot'

export const getOrSetWallet = async (deviceId: string, userId: string): Promise<any> => {
  const connMeta = await getMetaConnection()
  const conn = await getSlotConnection()
  try {
    let wallet = await getWallet(deviceId)
    console.log('wallet', wallet)
    if (!wallet) {
      // const [gameUserRows] = await connMeta.query(`select  * from  game_user where device_id = ${deviceId}`)
      // const gameUser = gameUserRows[0]
      // console.log('user', gameUser)
      const [respRows] = await conn.query(`
        insert into wallet(game_user_id, coins, tickets) value (${userId}, 0, 0)
      `)
      console.log('resprows', respRows)
      wallet = getWallet(deviceId)
    }
    return wallet
  } catch (error) {
    throw createError(httpStatusCodes.INTERNAL_SERVER_ERROR, error)
  }
}
export const gameInit = async (): Promise<any> => {
  const conn = await getSlotConnection()
  const resp: {reelsData: any[]} = {reelsData: []}
  try {
    const [reels] = await conn.query('select * from reel')
    for (const _reel of reels) {
      const [symbols] = await conn.query(`
            SELECT s.payment_type AS paymentType, s.texture_url AS textureUrl FROM reel_symbol rs
            INNER JOIN reel r ON rs.reel_id = r.id AND r.id = ${_reel.id}
            INNER JOIN symbol s ON rs.symbol_id = s.id
            order by rs.order
        `)
      const symbolsData: string[] = []
      symbols.forEach((_symbol) => symbolsData.push(_symbol))
      resp.reelsData.push({symbolsData})
    }
    conn.release()
    return resp
  } catch (error) {
    conn.release()
    console.log('error', error)
    throw createError(httpStatusCodes.INTERNAL_SERVER_ERROR, error)
  }
}
export const getProfile = async (deviceId: string): Promise<any> => {
  if (!deviceId) { throw createError(httpStatusCodes.BAD_REQUEST, 'deviceId is a required parameter') }
  const conn = await getMetaConnection()
  try {
    const userSelect = `
        select first_name, last_name, email
          from game_user
        where device_id ='${deviceId}'`
    const [rows] = await conn.query(userSelect)
    const user = rows[0]
    if (!user) { throw createError(httpStatusCodes.BAD_REQUEST, 'there is no user associated with this deviceId') }
    return user
  } finally {
    await conn.release()
  }
}
export const setProfile = async (deviceId: string, data: any = {}): Promise<any> => {
  if (!deviceId) { throw createError(httpStatusCodes.BAD_REQUEST, 'deviceId is a required parameter') }
  const conn = await getMetaConnection()
  try {
    const [userRows]: any = await conn.query(`select * from game_user where device_id = ${data.deviceId}`)
    const user = userRows[0]
    if (!user) {
      throw createError(httpStatusCodes.BAD_REQUEST, 'a user with this deviceId was not found')
    }
    const [respUpdate]: any = await conn.query(`
          update game_user set
              email = '${data.email}',
              first_name = '${data.firstName}',
              last_name = '${data.lastName}',
              device_name = '${data.deviceName}',
              device_model = '${data.deviceModel}'
          where device_id = '${deviceId}'
      `)
    console.log('respUpdate', respUpdate)
    const [userUpdatedRows]: any = await conn.query(`
          select id, first_name, last_name, email, device_id from game_user where device_id = '${deviceId}'
      `)
    const updatedUser = userUpdatedRows[0]
    return updatedUser
  } finally {
    await conn.release()
  }
}
export const spin = async (deviceId: string, bet: string): Promise<any> => {
  const wallet = await getWallet(deviceId)
  const spinData = await runSpin(deviceId, bet, wallet)
  const walletAfterBet = spinData.wallet
  if (spinData.isWin) { await updateWallet(deviceId, walletAfterBet) }
  return {spinData}
}
export const getWallet = async (deviceId: string): Promise<any> => {
  if (!deviceId) { throw createError(httpStatusCodes.BAD_REQUEST, 'deviceId is a required parameter') }
  const conn = await getSlotConnection()
  const user = await metaService.getUserByDeviceId(deviceId)
  try {
    const [walletRows] = await conn.query(
      `select coins, tickets from wallet where game_user_id ='${user.id}'`
    )
    const wallet = walletRows[0]
    if (!user) { throw createError(httpStatusCodes.BAD_REQUEST, 'there is no user associated with this deviceId') }
    return wallet
  } finally {
    await conn.release()
  }
}
async function updateWallet(deviceId: string, wallet: any): Promise<any> {
  // @TODO save spin to DB
  const conn = await getSlotConnection()
  try {
    const user = await metaService.getUserByDeviceId(deviceId)
    const [respUpdateRow] = await conn.query(`
      update wallet set coins = ${wallet.coins} where game_user_id = ${user.id}
  `)
    if (Number(respUpdateRow.affectedRows) !== 1) {
      throw createError(httpStatusCodes.INTERNAL_SERVER_ERROR, 'Something whent wrong storing the wallet')
    }
  } catch (error) {
    throw createError(httpStatusCodes.INTERNAL_SERVER_ERROR, error)
  } finally {
    await conn.release()
  }
}
export const purchaseTickets = async (deviceId: string, ticketAmount: number): Promise<any> => {
  if (!deviceId) { throw createError(httpStatusCodes.BAD_REQUEST, 'deviceId is a required parameter') }
  // @TODO trycatch
  const conn = await getSlotConnection()
  const wallet = await getWallet(deviceId)
  const ticketAmountAnt = wallet.tickets
  const user = await metaService.getUserByDeviceId(deviceId)
  // until we have a value for a ticket
  const ticketValue = 1
  const coinsRequired = ticketAmount * ticketValue
  if (wallet.coins < coinsRequired) { throw createError(400, 'There are no sufficient funds') }
  const [respUpdate] = await conn.query(`
    update wallet set
        coins = coins - ${coinsRequired},
        tickets = tickets + ${ticketAmount}
        where game_user_id = ${user.id}
  `)
  await conn.release()
  console.log('resp', respUpdate)
  wallet.tickets = ticketAmountAnt - ticketAmount
  return wallet
}


