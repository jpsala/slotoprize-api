import { getSetting, setSetting } from "./settings.service"

export async function getMiscSettingsForCrud(): Promise<any> {
  const gameVersion = await getSetting('gameVersion', '0.0.10')
  const maintenanceMode = await getSetting('maintenanceMode', '0')
  console.log('maintenanceMode', maintenanceMode, maintenanceMode === '1')
  return {gameVersion, maintenanceMode: maintenanceMode === '1'}
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function postMiscSettingsForCrud(settings: any): Promise<any> {
  console.log('settings', settings)
  await setSetting('gameVersion', settings.gameVersion)
  await setSetting('maintenanceMode', settings.maintenanceMode ? '1':'0')
  return { status: 'ok'}
}