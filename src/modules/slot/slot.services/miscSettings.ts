import { getSetting, setSetting } from "./settings.service"

export async function getMiscSettingsForCrud(): Promise<any> {
  const gameVersion = await getSetting('gameVersion', '0.0.10')
  const maintenanceMode = await getSetting('maintenanceMode', '0')
  const interstitialsRatio = Number(await getSetting('interstitialsRatio', '5'))
  const lapseForSpinRegeneration = Number(await getSetting('lapseForSpinRegeneration', '10')),
  const maxSpinsForSpinRegeneration = Number(await getSetting('maxSpinsForSpinRegeneration', '10')),
  const wallet = {
    spins: await getSetting('initialWalletTickets', '10'),
    coins: await getSetting('initialWalletCoins', '10'),
    tickets: await getSetting('initialWalletSpins', '10'),
  }
  console.log('maintenanceMode', maintenanceMode, maintenanceMode === '1')
  return {gameVersion, maintenanceMode: maintenanceMode === '1', wallet, interstitialsRatio, lapseForSpinRegeneration, maxSpinsForSpinRegeneration}
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function postMiscSettingsForCrud(settings: any): Promise<any> {
  console.log('settings', settings)
  await setSetting('gameVersion', settings.gameVersion)
  await setSetting('maintenanceMode', settings.maintenanceMode ? '1':'0')
  return { status: 'ok'}
}