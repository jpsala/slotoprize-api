import toCamelCase from 'camelcase-keys'
import createError from 'http-errors'
import * as httpStatusCodes from "http-status-codes"
import {queryOne as metaQueryOne, exec as metaExec} from '../meta/meta.db'
import {GameUser} from "../meta/meta.types"
import {getGameUserByDeviceId} from '../meta/meta.repo/user.repo'
import * as raffleRepo from '../meta/meta.repo/raffle.repo'
import * as spinService from "./slot.services/spin.service"
import {query as slotQuery} from './db.slot'
import {getWallet, updateWallet} from './slot.services/wallet.service'

export const getReelsData = async (): Promise<any> => {
  try {
    const symbolsData = await slotQuery('SELECT s.texture_url, s.payment_type FROM symbol s WHERE s.id IN (SELECT s.id FROM pay_table pt WHERE pt.symbol_id = s.id)')
    const reels: any[] = []
    for (let reel = 1; reel < 4; reel++) {
      reels.push({symbolsData: toCamelCase(symbolsData)})
      console.log('reels', reel, reels)
    }
    return reels
  } catch (error) {
    throw createError(httpStatusCodes.INTERNAL_SERVER_ERROR, error)
  }
}
export const getProfile = async (deviceId: string, fields: string[] | undefined = undefined): Promise<GameUser | Partial<GameUser>> => {
  if (!deviceId) throw createError(httpStatusCodes.BAD_REQUEST, 'deviceId is a required parameter')
  const gameUser = await getGameUserByDeviceId(deviceId, fields)
  if (!gameUser) throw createError(httpStatusCodes.BAD_REQUEST, 'there is no user associated with this deviceId')
  return gameUser
}
export const setProfile = async (user: GameUser): Promise<any> => {
  if (!user.deviceId) throw createError(httpStatusCodes.BAD_REQUEST, 'deviceId is a required parameter')
  const userExists = await metaQueryOne(`select * from game_user where device_id = '${user.deviceId}'`)
  if (!userExists)
    throw createError(httpStatusCodes.BAD_REQUEST, 'a user with this deviceId was not found')


  /* falta:
              countryPhoneCode: string;
              phoneNumber: string;
              isMale: boolean;
              age: number;
              address: string;
              city: string;
              zipCode: string;
              state: string;
              country: string;
*/
  await metaExec(`
          update game_user set
              email = '${user.email || ""}',
              first_name = '${user?.firstName || ""}',
              last_name = '${user.lastName || ""}',
              device_name = '${user.deviceName || ""}',
              device_model = '${user.deviceModel || ""}',
              country_phone_code = '${user.countryPhoneCode || ""}',
              phone_number = '${user.phoneNumber || ""}',
              is_male = '${user.isMale || ""}',
              age = '${user.age || ""}',
              address = '${user.address || ""}',
              city = '${user.city || ""}',
              zip_code = '${user.zipCode || ""}',
              state = '${user.state || ""}',
              country = '${user.country || ""}'
          where device_id = '${user.deviceId || ""}'
      `)
  const updatedUser = await metaQueryOne(`
          select id, first_name, last_name, email, device_id from game_user where device_id = '${user.deviceId}'
      `)
  return {firstName: updatedUser.first_name, lastName: updatedUser.last_name, email: updatedUser.email}
}
// eslint-disable-next-line require-await
export const spin = async (deviceId: string, multiplier: string): Promise<any> => {
  return spinService.spin(deviceId, Number(multiplier))
}
export const symbolsInDB = async (): Promise<any> => {
  try {
    const SymbolsRows = await slotQuery(
      'SELECT * FROM symbol s WHERE s.id IN (SELECT s.id FROM pay_table pt WHERE pt.symbol_id = s.id)'
    )
    const reels: any[] = []
    for (let reel = 1; reel < 4; reel++)
      reels[reel] = SymbolsRows

    return {reels, symbols: SymbolsRows}
  } catch (error) {
    return {status: 'error'}
  }
}
export const rafflePurchase = async (
  deviceId: string,
  id: number,
  amount: number
): Promise<any> => {
  if(!deviceId) throw createError(httpStatusCodes.BAD_REQUEST, 'deviceId is a required parameter')
  if(!amount) throw createError(httpStatusCodes.BAD_REQUEST, 'amount is a required parameter')
  if(amount < 1) throw createError(httpStatusCodes.BAD_REQUEST, 'amount can not be less than 1')
  if(!id) throw createError(httpStatusCodes.BAD_REQUEST, 'raffleId is a required parameter')

  // @TODO trycatch
  const user = await getGameUserByDeviceId(deviceId)
  const wallet = await getWallet(deviceId)
  const raffle = await raffleRepo.getRaffle(id)
  if (!raffle) throw createError(httpStatusCodes.BAD_REQUEST, 'there is no raffle with that ID')
  const raffleCostInTickets = raffle.raffleNumberPrice
  const totalTicketsNeeded = raffleCostInTickets * amount
  if (totalTicketsNeeded > wallet.tickets) throw createError(createError.BadRequest, 'Insufficient tickets')
  const raffleId = await raffleRepo.saveRaffle(raffle, user, totalTicketsNeeded, amount)
  if(raffleId < 0) throw createError(createError.InternalServerError, 'Error saving raffle to db')
  wallet.tickets -= totalTicketsNeeded
  updateWallet(deviceId, wallet)
  // eslint-disable-next-line no-return-await
  return await getWallet(deviceId)
}
