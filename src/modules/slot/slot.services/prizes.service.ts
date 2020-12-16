import { getJackpotWinners } from './jackpot.service'
import { getWinners } from './../../meta/meta.repo/raffle.repo'
export type PrizeWinners = { date: string, winnerName: string, textureUrl: string, prizeName: string }
export const getPrizes = async (): Promise<PrizeWinners[]> =>
{
  const raffleWinners = await getWinners()
  const jackpotWinners = await getJackpotWinners()
  const retData: Array<PrizeWinners> = []
  retData.push(...raffleWinners, ...jackpotWinners)
  const retDataOrdered = retData.sort( (a, b) => {
    if (a.date > b.date)  return 1 
    if  (a.date < b.date)  return -1 
    return 0
  })
  // for (const row of retDataOrdered) 
  //   console.log(row.prizeName, row.date )
  
  // console.log('retData', retData, retDataOrdered)
  return retDataOrdered
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