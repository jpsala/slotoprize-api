import { getNewSavedFakeUser } from '../../../meta/meta.repo/gameUser.repo'
import { GameUser } from './../../../meta/meta.types'
import { getLastSpin, getDailyRewardPrizes } from "./dailyReward.spin"
describe('daily reward', () => {
  let user: GameUser
  beforeAll(async () => {
    user = await getNewSavedFakeUser()
  })
  it('last spin date', async () => {
    const respLastSpin = await getLastSpin(user)
    console.log('resp', respLastSpin)
    expect(respLastSpin).toBeUndefined()
  })
  it('getDailyRewardPrizes', async () => {
    const dailyRewardPrizes = await getDailyRewardPrizes()
    console.log('dailyRewardPrizes', dailyRewardPrizes)
    expect(dailyRewardPrizes).not.toBeUndefined()
  })
})