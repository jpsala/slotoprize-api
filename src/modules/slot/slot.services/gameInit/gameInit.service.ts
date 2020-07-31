import createError from 'http-errors'
import toCamelCase from 'camelcase-keys'
import {LanguageData, GameUser} from "../../../meta/meta.types"
import * as languageRepo from "../../../meta/meta.repo/language.repo"
import {setReqUser} from '../../../meta/authMiddleware'
import {getOrSetGameUserByDeviceId} from "../../../meta/meta-services/meta.service"
import {getNewToken} from '../../../../services/jwtService'
import {getHaveWinRaffle, getHaveProfile} from '../../../meta/meta.repo/gameUser.repo'
import {getOrSetWallet} from "../wallet.service"
import {getSetting} from "../settings.service"
import {getReelsData} from "../symbol.service"
import {getPayTable} from "../spin.service"
import { getLooseSpin } from './../spinLoose/spinLoose'
import { getLastSpinDays } from './dailyReward.spin'
import { getDailyRewardPrizes, DailyRewardPrize, setSpinData, isDailyRewardClaimed } from './../../slot.repo/dailyReward.repo'

export async function gameInit(deviceId: string): Promise<any> {
  try {
    const rawUser = (await getOrSetGameUserByDeviceId(deviceId)) as Partial<GameUser>
    setReqUser(deviceId, rawUser.id as number)
    const wallet = await getOrSetWallet(deviceId, String(rawUser.id))
    const payTable = await getPayTable()
    const betPrice = Number(await getSetting('betPrice', '1'))
    const ticketPrice = Number(await getSetting('ticketPrice', '1'))
    const maxMultiplier = Number(await getSetting('maxMultiplier', '3'))
    const languages = (await languageRepo.getLanguages(['language_code', 'texture_url', 'localization_url'])) as Array<Partial<LanguageData>>
    // const requireProfileData = Number(await settingGet('requireProfileData', 0))
    // const languageData = (await metaRepo.getLanguageData(rawUser.id + 3)) as Partial<LanguageData>
    // @URGENT crear savelogin
    // await metaService.saveLogin(rawUser.id, 'SlotoPrizes', deviceId)
    // const rawUser = {id: 1, first_name: 'first', last_name: 'last', email: 'email'}
    const hasPendingPrize = await getHaveWinRaffle(rawUser.id as number)
    const requireProfileData = hasPendingPrize && !await getHaveProfile(rawUser.id as number)
    const token = getNewToken({id: rawUser.id, deviceId})
    // delete rawUser.id
    delete rawUser.deviceId
    delete rawUser.createdAt
    delete rawUser.modifiedAt
    delete rawUser.password
    const reelsData = await getReelsData()
    reelsData.forEach((reel) => {
      reel.symbolsData.forEach((reelSymbol) => {
        const symbolPays: any[] = []
        payTable.filter((payTableSymbol) => payTableSymbol.payment_type === reelSymbol.paymentType)
          .forEach((_symbol) => symbolPays.push(_symbol))
        const symbolAllPays: any[] = []
        for (let index = 1; index < 4; index++) {
          const row = symbolPays.find((_symbol) => _symbol.symbol_amount === index)
          if (row) symbolAllPays.push(row.points)
          else symbolAllPays.push(0)
        }
        reelSymbol.pays = symbolAllPays
      })
    })
    const dailyRewards: DailyRewardPrize[] = await getDailyRewardPrizes()
    const consecutiveDailyLogs = await getLastSpinDays(rawUser as GameUser)
    const dailyRewardClaimed = await isDailyRewardClaimed(deviceId)
    await setSpinData(rawUser as GameUser)
    const languageCode = rawUser.languageCode
    const defaultSpinData = await getLooseSpin()
    delete rawUser.languageCode
    const initData = {
      sessionId: token,
      requireProfileData: requireProfileData ? 1 : 0,
      languageCode,
      defaultSpinData,
      hasPendingPrize: hasPendingPrize ? 1 : 0,
      profileData: toCamelCase(rawUser),
      languagesData: toCamelCase(languages),
      consecutiveDailyLogs,
      dailyRewardsData: dailyRewards,
      dailyRewardClaimed,
      ticketPrice,
      betPrice,
      maxMultiplier,
      reelsData,
      walletData: wallet,
    }
    return initData
  } catch (error) {
    throw createError(createError.InternalServerError, error)
  }
}
