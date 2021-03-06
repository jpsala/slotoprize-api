import { getTicketPacks, validateTicketPacksData } from "./events/ticket.service"
import { getSetting, setSetting } from "./settings.service"
export const getTicketsSettingsForCrud = async (): Promise<any> => {
  const ticketPrice = Number(await getSetting('ticketPrice', '1'))
  const interstitialsRatio = Number(await getSetting('interstitialsRatio', '5'))
  const nextRaffleSessionSpins = Number(await getSetting('nextRaffleSessionSpins', '7'))
  const incomingRaffleThresholdInDays = Number(await getSetting('incomingRaffleThresholdInDays', '5'))
  const wallet = {
    tickets: await getSetting('initialWalletTickets', '10'),
    coins: await getSetting('initialWalletCoins', '10'),
    spins: await getSetting('initialWalletSpins', '10'),
  }
  const lapseForSpinRegeneration = Number(await getSetting('lapseForSpinRegeneration', '10'))
  const maxSpinsForSpinRegeneration = Number(await getSetting('maxSpinsForSpinRegeneration', '10'))
  const ticketPacksData = await getTicketPacks()
  return { ticketPrice, wallet, interstitialsRatio, lapseForSpinRegeneration, maxSpinsForSpinRegeneration, nextRaffleSessionSpins, incomingRaffleThresholdInDays, ticketPacksData }
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
  await setSetting('nextRaffleSessionSpins', settings.nextRaffleSessionSpins)
  await setSetting('incomingRaffleThresholdInDays', settings.incomingRaffleThresholdInDays)
  validateTicketPacksData(settings.ticketPacksData)
  const ticketPacksData = JSON.stringify(settings.ticketPacksData)
  await setSetting('ticketPacksData', ticketPacksData)
} 