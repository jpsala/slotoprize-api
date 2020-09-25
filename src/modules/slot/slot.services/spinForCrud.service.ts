import { getSetting, setSetting } from "./settings.service"

export async function getSpinSettingsForCrud(): Promise<number>{
  return Number(await getSetting('interstitialsRatio', '10'))
}
export async function setSpinSettingsForCrud(value: string): Promise<void>{
  await setSetting('interstitialsRatio', value)
}