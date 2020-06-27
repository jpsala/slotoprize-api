import createError from 'http-errors'
import * as httpStatusCodes from "http-status-codes"
import * as metaService from '../../meta/meta.service'
import getSlotConnection, {exec} from '../db.slot'

export const getWallet = async (deviceId: string): Promise<any> => {
  if (!deviceId) { throw createError(httpStatusCodes.BAD_REQUEST, 'deviceId is a required parameter') }
  const conn = await getSlotConnection()
  const user = await metaService.getGameUserByDeviceId(deviceId)
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
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function updateWallet(deviceId: string, wallet: any): Promise<any> {
  // @TODO save spin to DB
  const conn = await getSlotConnection()
  try {
    const user = await metaService.getGameUserByDeviceId(deviceId)
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
  const user = await metaService.getGameUserByDeviceId(deviceId)
  // until we have a value for a ticket
  const ticketValue = 1
  const coinsRequired = ticketAmount * ticketValue
  if (wallet.coins < coinsRequired) { throw createError(400, 'There are no sufficient funds') }
  await conn.query(`
    update wallet set
        coins = coins - ${coinsRequired},
        tickets = tickets + ${ticketAmount}
        where game_user_id = ${user.id}
  `)
  await conn.release()
  wallet.tickets = ticketAmountAnt - ticketAmount
  return wallet
}
export const getOrSetWallet = async (deviceId: string, userId: string): Promise<any> => {
  let wallet = await getWallet(deviceId)
  if (!wallet) {
    await exec(`
        insert into wallet(game_user_id, coins, tickets) value (${userId}, 0, 0)
      `)
    wallet = await getWallet(deviceId)
  }
}
