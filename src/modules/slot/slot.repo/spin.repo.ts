import { getSetting, setSetting } from './../slot.services/settings.service'

export const getSpinData = async (): Promise<any> =>
{
  return {
    cycle: await getSetting('jackpotCycle', 10),
    prize: await getSetting('jackpotPrized', 1000),
    spinCount: await getSetting('spinCount', 0)
  }
}

export const setSpinData = async(body: {cycle: string, prize: string}): Promise<any> =>
{
  await setSetting('jackpotCycle', body.cycle)
  await setSetting('jackpotPrized', body.prize)
}
