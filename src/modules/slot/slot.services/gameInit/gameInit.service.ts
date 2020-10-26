import toCamelCase from 'camelcase-keys'
import createHttpError from 'http-errors'
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from 'http-status-codes'
import {LanguageData, GameUser} from "../../../meta/meta.types"
import * as languageRepo from "../../../meta/meta.repo/language.repo"
// import {setReqUser} from '../../../meta/authMiddleware'
import {getOrSetGameUserByDeviceId} from "../../../meta/meta-services/meta.service"
import {getNewToken} from '../../../../services/jwtService'
import {getHaveWinRaffle, setGameUserLogin, getWinRaffle, resetPendingPrize } from '../../../meta/meta.repo/gameUser.repo'
import {getWallet} from "../wallet.service"
import {getSetting} from "../settings.service"
import {getReelsData} from "../symbol.service"
import {getPayTable} from "../spin.service"
import { getLastSpinDays } from './dailyReward.spin'
import { getDailyRewardPrizes, DailyRewardPrize, setSpinData, isDailyRewardClaimed } from './../../slot.repo/dailyReward.repo'

export async function gameInit(deviceId: string): Promise<any> {
  try {
    const rawUser = (await getOrSetGameUserByDeviceId(deviceId)) as Partial<GameUser>
    if(Number(rawUser.banned) === 1) throw createHttpError(BAD_REQUEST, 'User is banned')
    // setReqUser(deviceId, rawUser.id as number)
    const wallet = await getWallet(rawUser as GameUser)
    const payTable = await getPayTable()
    const betPrice = Number(await getSetting('betPrice', '1'))
    const ticketPrice = Number(await getSetting('ticketPrice', '1')) 
    const maxMultiplier = Number(await getSetting('maxMultiplier', '3'))
    const languages = (await languageRepo.getLanguages()) as Array<Partial<LanguageData>>
    // const requireProfileData = Number(await settingGet('requireProfileData', 0))
    // const languageData = (await metaRepo.getLanguageData(rawUser.id + 3)) as Partial<LanguageData>
    // @URGENT crear savelogin
    // const rawUser = {id: 1, first_name: 'first', last_name: 'last', email: 'email'}
    const hasPendingRaffle = await getHaveWinRaffle(rawUser.id as number)
    // const hasPendingJackpot = await getHaveWinJackpot(rawUser.id as number)
    // const pendingPrizeIsJackpot = hasPendingJackpot
    const rafflePrizeData = hasPendingRaffle ? await getWinRaffle(rawUser.id as number) : undefined
    const hasPendingPrize = hasPendingRaffle
    await resetPendingPrize(rawUser.id as number)
    const token = getNewToken({id: rawUser.id, deviceId})
    await setGameUserLogin(deviceId)
    delete rawUser.deviceId
    delete rawUser.createdAt
    delete rawUser.modifiedAt
    delete rawUser.password
    delete rawUser.sendWinJackpotEventWhenProfileFilled
    const reelsData = await getReelsData()
    reelsData.forEach((reel) => {
      reel.symbolsData.forEach((reelSymbol) => {
        const symbolPays: any[] = []
        payTable.filter((payTableSymbol) => payTableSymbol.symbol_name === reelSymbol.symbolName)
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
    await setSpinData(rawUser as GameUser)
    const consecutiveDailyLogs = await getLastSpinDays(rawUser as GameUser)
    const dailyRewardClaimed = await isDailyRewardClaimed(deviceId)
    const languageCode = rawUser.languageCode
    delete rawUser.languageCode
    const interstitialsRatio = Number(await getSetting('interstitialsRatio', '5'))
    const maxAllowedBirthYear = Number(await getSetting('maxAllowedBirthYear', '2002'))
    const gameVersion = String(await getSetting('gameVersion', '0.1'))
    const initData = {
      sessionId: token,
      gameVersion,
      gameIdentifier: await getSetting('gameIdentifier', 'this is the gameIdentifier'),
      // requireProfileData: requireProfileData ? 1 : 0,
      languageCode,
      interstitialsRatio,
      hasPendingPrize,
      rafflePrizeData,
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
      maxAllowedBirthYear
    }
    if(!rafflePrizeData) delete initData.rafflePrizeData
    return initData
  } catch (error) {
    throw createHttpError(INTERNAL_SERVER_ERROR, error)
  }
}
