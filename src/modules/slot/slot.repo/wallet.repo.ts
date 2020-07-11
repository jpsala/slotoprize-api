import {ResultSetHeader} from 'mysql2/promise'
import createError from 'http-errors'
import * as httpStatusCodes from 'http-status-codes'
import * as metaService from '../../meta/meta.service'
import getSlotConnection from '../db.slot'
import {Wallet} from '../slot.types'

export const getWalletByDeviceId = async (deviceId: string): Promise<Wallet> => {
  if (!deviceId)
    throw createError(
            httpStatusCodes.BAD_REQUEST,
            'deviceId is a required parameter'
        )

  const conn = await getSlotConnection()
  const user = await metaService.getGameUserByDeviceId(deviceId)
  try {
    const [walletRows] = await conn.query(
            `select coins, tickets from wallet where game_user_id ='${user.id}'`
        )
    const wallet = walletRows[0]
    if (!user)
      throw createError(
                httpStatusCodes.BAD_REQUEST,
                'there is no user associated with this deviceId'
            )

    return wallet
  } finally {
    await conn.destroy()
  }
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
