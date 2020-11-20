import { getSetting, setSetting } from "./settings.service"

export const getTicketsSettingsForCrud = async (): Promise<any> => {
  const ticketPrice = Number(await getSetting('ticketPrice', '1'))
  const interstitialsRatio = Number(await getSetting('interstitialsRatio', '5'))
  const wallet = {
    tickets: await getSetting('initialWalletTickets', '10'),
    coins: await getSetting('initialWalletCoins', '10'),
    spins: await getSetting('initialWalletSpins', '10'),
  }
  const lapseForSpinRegeneration = Number(await getSetting('lapseForSpinRegeneration', '10'))
  const maxSpinsForSpinRegeneration = Number(await getSetting('maxSpinsForSpinRegeneration', '10'))
  return { ticketPrice, wallet, interstitialsRatio, lapseForSpinRegeneration, maxSpinsForSpinRegeneration }
} 
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const postTicketsSettingsForCrud = async (settings: any): Promise<void> => {
  await setSetting('ticketPrice', settings.ticketPrice)
  await setSetting('interstitialsRatio', settings.interstitialsRatio)
  if(settings.lapseForSpinRegeneration) await setSetting('lapseForSpinRegeneration', settings.lapseForSpinRegeneration)
  if(settings.maxSpinsForSpinRegeneration) await setSetting('maxSpinsForSpinRegeneration', settings.maxSpinsForSpinRegeneration)
  await setSetting('initialWalletTickets', settings.wallet.tickets)
  await setSetting('initialWalletCoins', settings.wallet.coins)
  await setSetting('initialWalletSpins', settings.wallet.spins)

} 