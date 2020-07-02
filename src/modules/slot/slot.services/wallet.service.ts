import createError from 'http-errors'
import * as httpStatusCodes from 'http-status-codes'
import * as metaService from '../../meta/meta.service'
import getSlotConnection, {exec} from '../db.slot'
import {Wallet} from '../slot.types'
import {settingGet} from './settings.service'

export const getWallet = async (deviceId: string): Promise<any> => {
  if (!deviceId) {
    throw createError(
            httpStatusCodes.BAD_REQUEST,
            'deviceId is a required parameter'
        )
  }
  const conn = await getSlotConnection()
  const user = await metaService.getGameUserByDeviceId(deviceId)
  try {
    const [walletRows] = await conn.query(
            `select coins, tickets from wallet where game_user_id ='${user.id}'`
        )
    const wallet = walletRows[0]
    if (!user) {
      throw createError(
                httpStatusCodes.BAD_REQUEST,
                'there is no user associated with this deviceId'
            )
    }
    return wallet
  } finally {
    await conn.release()
  }
}
export async function updateWallet(
    deviceId: string,
    wallet: Wallet
): Promise<any> {
    // @TODO save spin to DB
  const conn = await getSlotConnection()
  try {
    const user = await metaService.getGameUserByDeviceId(deviceId)
    const [respUpdateRow] = await conn.query(`
      update wallet set coins = ${wallet.coins} where game_user_id = ${user.id}
  `)
    if (Number(respUpdateRow.affectedRows) !== 1) {
      throw createError(
                httpStatusCodes.INTERNAL_SERVER_ERROR,
                'Something whent wrong storing the wallet'
            )
    }
  } catch (error) {
    throw createError(httpStatusCodes.INTERNAL_SERVER_ERROR, error)
  } finally {
    await conn.release()
  }
}
export const purchaseTickets = async (
    deviceId: string,
    ticketAmount: number
): Promise<any> => {
  if (!deviceId) {
    throw createError(
            httpStatusCodes.BAD_REQUEST,
            'deviceId is a required parameter'
        )
  }
    // @TODO trycatch
  const conn = await getSlotConnection()
  const wallet = await getWallet(deviceId)
  const ticketAmountAnt = wallet.tickets
  const coinsAmountAnt = wallet.coins
  const user = await metaService.getGameUserByDeviceId(deviceId)
  const ticketPrice = Number(await settingGet('ticketPrice', '1'))

  const coinsRequired = ticketAmount * ticketPrice
  if (wallet.coins < coinsRequired) {
    throw createError(400, 'There are no sufficient funds')
  }
  await conn.query(`
    update wallet set
        coins = coins - ${coinsRequired},
        tickets = tickets + ${ticketAmount}
        where game_user_id = ${user.id}
  `)
  await conn.release()
  wallet.tickets = ticketAmountAnt + ticketAmount
  wallet.coins = coinsAmountAnt - coinsRequired
  return wallet
}
export const getOrSetWallet = async (
    deviceId: string,
    userId: string
): Promise<any> => {
  let wallet = await getWallet(deviceId)
  if (!wallet) {
    const initialWalletTickets = Number(
            await settingGet('initialWalletTickets', '10')
        )
    const initialWalletCoins = Number(
            await settingGet('initialWalletCoins', '10')
        )
    await exec(`
      insert into wallet(game_user_id, coins, tickets) value (${userId}, ${initialWalletCoins}, ${initialWalletTickets})
    `)
    wallet = await getWallet(deviceId)
  }
  return wallet
}
