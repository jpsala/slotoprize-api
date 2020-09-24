import { getSetting } from "./settings.service"

export const getAdsSettingsForCrud = async (): Promise<number> => {
  const interstitialsRatio = Number(await getSetting('interstitialsRatio', '5'))
  return interstitialsRatio
} 