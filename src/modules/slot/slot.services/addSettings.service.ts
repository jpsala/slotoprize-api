import { getSetting, setSetting } from "./settings.service"

export const getAdsSettingsForCrud = async (): Promise<number> => {
  const interstitialsRatio = Number(await getSetting('interstitialsRatio', '5'))
  return interstitialsRatio
} 
export const postAdsSettingsForCrud = async (interstitialsRatio: string): Promise<void> => {
  await setSetting('interstitialsRatio', interstitialsRatio)
  console.log('ins', interstitialsRatio)
} 