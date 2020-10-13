import { getSetting, setSetting } from "./settings.service"

export async function getMiscSettingsForCrud(): Promise<any> {
  const gameVersion = await getSetting('gameVersion', '0.0.10')
  return {gameVersion}
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function postMiscSettingsForCrud(settings: any): Promise<any> {
  await setSetting('gameVersion', settings.gameVersion)
  return { status: 'ok'}
}