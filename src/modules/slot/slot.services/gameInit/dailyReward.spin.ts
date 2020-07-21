import * as dailyRewardRepo from './../../slot.repo/dailyReward.repo'
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

export const getLastSpin = async (user): Promise<any> => {
  const lastSpin = await dailyRewardRepo.getLastSpin(user)
  return lastSpin
}
export const getDailyRewardPrizes = async (): Promise<any> => {
  const dailyRewardPrizes = await dailyRewardRepo.getDailyRewardPrizes()
  return dailyRewardPrizes
}