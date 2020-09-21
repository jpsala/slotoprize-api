import { getJackpotWinners } from './jackpot.service'
import { getWinners } from './../../meta/meta.repo/raffle.repo'
export type PrizeWinners = { date: string, winnerName: string, textureUrl: string }
export const getPrizes = async (): Promise<PrizeWinners> =>
{
  const raffleWinners = await getWinners()
  const jackpotWinners = await getJackpotWinners()
  const retData: Array<PrizeWinners> = []
  retData.push(...raffleWinners, ...jackpotWinners)
  return retData
}


/*
    public class PrizeWinnerData
    {
        public string prizeName; // Raffle title or "Jackpot".
        public string date;
        public string winnerName;
        public string textureUrl;
    }
*/