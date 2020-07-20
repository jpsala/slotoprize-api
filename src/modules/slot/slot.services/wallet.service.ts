/* eslint-disable no-return-await */
import createError from 'http-errors'
import * as httpStatusCodes from 'http-status-codes'
import {ResultSetHeader} from 'mysql2'
import * as metaService from '../../meta/meta-services/meta.service'
import getSlotConnection, {exec} from '../../../db'
import {Wallet} from '../slot.types'
import * as slotRepo from "../slot.repo"
import * as slotService from '.'
// import {slotService.setting.getSetting} from './settings.service'

export const getWallet = async (deviceId: string): Promise<Wallet> => {
  if (!deviceId)
    throw createError(
            httpStatusCodes.BAD_REQUEST,
            'deviceId is a required parameter'
        )
  return await slotRepo.wallet.getWalletByDeviceId(deviceId)
}
export async function updateWallet(
    deviceId: string,
    wallet: Wallet
): Promise<ResultSetHeader> {
  const conn = await getSlotConnection()
  try {
    const user = await metaService.getGameUserByDeviceId(deviceId)
    const [respUpdateRow] = await conn.query(`
      update wallet set coins = ${wallet.coins}, tickets = ${wallet.tickets} where game_user_id = ${user.id}
  `) as ResultSetHeader[]
    if (Number(respUpdateRow.affectedRows) !== 1)
      throw createError(
                httpStatusCodes.INTERNAL_SERVER_ERROR,
                'Something whent wrong storing the wallet'
      )
    return respUpdateRow

  } catch (error) {
    throw createError(httpStatusCodes.INTERNAL_SERVER_ERROR, error)
  } finally {
    await conn.destroy()
  }
}
export const purchaseTickets = async (
    deviceId: string,
    ticketAmount: number
): Promise<any> => {
  if (!deviceId) throw createError(httpStatusCodes.BAD_REQUEST, 'deviceId is a required parameter')

    // @TODO trycatch
  const conn = await getSlotConnection()
  let wallet = await getWallet(deviceId)
  const user = await metaService.getGameUserByDeviceId(deviceId)
    // until we have a value for a ticket
  const ticketValue = Number(await slotService.setting.getSetting('ticketPrice', 1))
  const coinsRequired = ticketAmount * ticketValue
  if (wallet.coins < coinsRequired)
    throw createError(400, 'There are no sufficient funds')

  await conn.query(`
    update wallet set
        coins = coins - ${coinsRequired},
        tickets = tickets + ${ticketAmount}
        where game_user_id = ${user.id}
  `)
  await conn.destroy()
  wallet = await getWallet(deviceId)
  return wallet
}
export const getOrSetWallet = async (
    deviceId: string,
    userId: string
): Promise<any> => {
  let wallet = await getWallet(deviceId)
  if (!wallet) {
    const initialWalletTickets = Number(
            await slotService.setting.getSetting('initialWalletTickets', '10')
        )
    const initialWalletCoins = Number(
            await slotService.setting.getSetting('initialWalletCoins', '10')
        )
    await exec(`
      insert into wallet(game_user_id, coins, tickets) value (${userId}, ${initialWalletCoins}, ${initialWalletTickets})
    `)
    wallet = await getWallet(deviceId)
  }
  return wallet
}
