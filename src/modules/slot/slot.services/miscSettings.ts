import createHttpError from "http-errors"
import { BAD_REQUEST } from "http-status-codes"
import { getSetting, setSetting } from "./settings.service"

export async function getMiscSettingsForCrud(): Promise<any> {
  const gameVersion = await getSetting('gameVersion', '0.0.10')
  const maintenanceMode = await getSetting('maintenanceMode', '0')
  const interstitialsRatio = Number(await getSetting('interstitialsRatio', '5'))
  const spinTimeThreshold = Number(await getSetting('spinRatioTimer', '10'))
  const lapseForSpinRegeneration = Number(await getSetting('lapseForSpinRegeneration', '10'))
  const maxSpinsForSpinRegeneration = Number(await getSetting('maxSpinsForSpinRegeneration', '10'))
  const signupCount = Number(await getSetting('signupCount', '10'))
  const localizationJsonUrl = await getSetting('localizationJsonUrl', 'https://script.google.com/macros/s/AKfycbzkBJBlnS7HfHMj5rlZvAcLTEuoHHBP6848nJ2mfnBzfQ2xge0w/exec?ssid=1zHwpbks-VsttadBy9LRdwQW7E9aDGBc0e80Gw2ALNuQ&sheet=<environment>&langCode=<languageCode>')
  const localizationSpreadsheetUrlDev = await getSetting('localizationSpreadsheetUrlDev', 'https://docs.google.com/spreadsheets/d/1zHwpbks-VsttadBy9LRdwQW7E9aDGBc0e80Gw2ALNuQ/edit#gid=1259474418')
  const localizationSpreadsheetUrlLive = await getSetting('localizationSpreadsheetUrlLive', 'https://docs.google.com/spreadsheets/d/1zHwpbks-VsttadBy9LRdwQW7E9aDGBc0e80Gw2ALNuQ/edit#gid=1117868095')
  const wallet = {
    tickets: await getSetting('initialWalletTickets', '10'),
    coins: await getSetting('initialWalletCoins', '10'),
    spins: await getSetting('initialWalletSpins', '10'),
  }
  console.log('maintenanceMode', maintenanceMode, maintenanceMode === '1')
  return {gameVersion, signupCount, maintenanceMode: maintenanceMode === '1', wallet, interstitialsRatio, lapseForSpinRegeneration, maxSpinsForSpinRegeneration, spinTimeThreshold, localizationJsonUrl, localizationSpreadsheetUrlDev, localizationSpreadsheetUrlLive}
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function postMiscSettingsForCrud(settings: any): Promise<any> {
  const localizationJsonUrl: string = settings.localizationJsonUrl
  if(!localizationJsonUrl.includes('<languageCode>')) throw createHttpError(BAD_REQUEST, 'localizationJsonUrl bad formed, please include <languageCode> where the parameter while be inserted')
  await setSetting('gameVersion', settings.gameVersion)
  await setSetting('spinRatioTimer', settings.spinTimeThreshold)
  await setSetting('maintenanceMode', settings.maintenanceMode ? '1' : '0')
  await setSetting('interstitialsRatio', settings.interstitialsRatio)
  await setSetting('signupCount', settings.signupCount)
  await setSetting('localizationJsonUrl', settings.localizationJsonUrl)
  await setSetting('localizationSpreadsheetUrlDev', settings.localizationSpreadsheetUrlDev)
  await setSetting('localizationSpreadsheetUrlLive', settings.localizationSpreadsheetUrlLive)
  if(settings.lapseForSpinRegeneration) await setSetting('lapseForSpinRegeneration', settings.lapseForSpinRegeneration)
  if(settings.maxSpinsForSpinRegeneration) await setSetting('maxSpinsForSpinRegeneration', settings.maxSpinsForSpinRegeneration)
  // wallet: state.wallet,
  await setSetting('initialWalletTickets', settings.wallet.tickets)
  await setSetting('initialWalletCoins', settings.wallet.coins)
  await setSetting('initialWalletSpins', settings.wallet.spins)
  return { status: 'ok'}
}