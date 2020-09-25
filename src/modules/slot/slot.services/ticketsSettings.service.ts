import { getSetting, setSetting } from "./settings.service"

export const getTicketsSettingsForCrud = async (): Promise<number> => {
  const ticketPrice = Number(await getSetting('ticketPrice', '1'))
  return ticketPrice
} 
export const postTicketsSettingsForCrud = async (ticketPrice: string): Promise<void> => {
  await setSetting('ticketPrice', ticketPrice)
  console.log('ins', ticketPrice)
} 