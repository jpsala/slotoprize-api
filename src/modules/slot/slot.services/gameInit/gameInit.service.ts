import toCamelCase from 'camelcase-keys'
import createHttpError from 'http-errors'
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from 'http-status-codes'
import {LanguageData, GameUser} from "../../../meta/meta.types"
import * as languageRepo from "../../../meta/meta.repo/language.repo"
// import {setReqUser} from '../../../meta/authMiddleware'E
import {getOrSetGameUserByDeviceId} from "../../../meta/meta-services/meta.service"
import {getNewToken} from '../../../../services/jwtService'
import {getHaveWinRaffle, setGameUserLogin, getWinRaffle, resetPendingPrize } from '../../../meta/meta.repo/gameUser.repo'
import {getWallet} from "../wallet.service"
import {getSetting} from "../settings.service"
import { gameUserToProfile } from "../profile.service"
import { getLocalization } from '../../../meta/meta-services/localization.service'
import { getLastSpinDays } from './dailyReward.spin'
import { getDailyRewardPrizes, DailyRewardPrize, setSpinData, isDailyRewardClaimed } from './../../slot.repo/dailyReward.repo'
export async function gameInit(deviceId: string): Promise<any> {
  try {
    let rawUser = (await getOrSetGameUserByDeviceId(deviceId)) as Partial<GameUser>
    const tutorialComplete = (rawUser.tutorialComplete || 0 as number) === 1
    const maintenanceMode = (await getSetting('maintenanceMode', '0')) === '1'
    if (maintenanceMode && !rawUser.isDev)
    throw createHttpError(503, await getLocalization('maintenanceMode', rawUser.id, 'We are in maintenance, we\'ll be back up soon!'))
    if(Number(rawUser.banned) === 1) throw createHttpError(BAD_REQUEST, 'Forbidden Error')
    // setReqUser(deviceId, rawUser.id as number)
    const wallet = tutorialComplete ?
      await getWallet(rawUser as GameUser) :
      {spins: 1, coins: 0, tickets: 0}
    // const betPrice = Number(await getSetting('betPrice', '1'))
    const ticketPrice = Number(await getSetting('ticketPrice', '1')) 
    const languages = (await languageRepo.getLanguages()) as Array<Partial<LanguageData>>
    // const requireProfileData = Number(await settingGet('requireProfileData', 0))
    // const languageData = (await metaRepo.getLanguageData(rawUser.id + 3)) as Partial<LanguageData>
    // @URGENT crear savelogin
    // const rawUser = {id: 1, first_name: 'first', last_name: 'last', email: 'email'}

    const hasPendingRaffle = tutorialComplete ?
      await getHaveWinRaffle(rawUser.id as number) :
      false
    
    const token = getNewToken({id: rawUser.id, deviceId})
    const rafflePrizeData = hasPendingRaffle ? await getWinRaffle(rawUser.id as number) : undefined

    const hasPendingPrize = tutorialComplete ? hasPendingRaffle : false

    if (tutorialComplete) await resetPendingPrize(rawUser.id as number)


    await setGameUserLogin(deviceId)
    await setSpinData(rawUser as GameUser)

    
    const dailyRewards: DailyRewardPrize[] = await getDailyRewardPrizes()
    const consecutiveLogsIdx = await getLastSpinDays(rawUser as GameUser)
    const dailyRewardClaimed = tutorialComplete ? (await isDailyRewardClaimed(deviceId)) : true
    const languageCode = rawUser.languageCode
    const interstitialsRatio = Number(await getSetting('interstitialsRatio', '5'))
    const maxAllowedBirthYear = Number(await getSetting('maxAllowedBirthYear', '2002'))
    const gameVersion = String(await getSetting('gameVersion', '0.1'))
    const gameIdentifier = await getSetting('gameIdentifier', 'this is the gameIdentifier')
    const signupCount = Number(await getSetting('signupCount', '10'))
  rawUser = gameUserToProfile(rawUser)
    
    delete rawUser.deviceId
    delete rawUser.languageCode

    const initData = {
      sessionId: token,
      gameVersion,
      gameIdentifier,
      languageCode,
      interstitialsRatio,
      signupCount,
      hasPendingPrize,
      rafflePrizeData,
      profileData: toCamelCase(rawUser),
      languagesData: toCamelCase(languages),
      consecutiveLogsIdx,
      dailyRewardsData: dailyRewards,
      dailyRewardClaimed,
      ticketPrice,
      walletData: wallet,
      maxAllowedBirthYear
    }
    if(!rafflePrizeData) delete initData.rafflePrizeData
    return initData
  } catch (error) {
    throw createHttpError(INTERNAL_SERVER_ERROR, error)
  }
}
