import { getNewSavedFakeUser } from '../../meta/meta.repo/gameUser.repo'
import { deleteDataInTestDB } from '../../../services/initDB/initDB'
import { getLastSpinDays } from '../slot.services/gameInit/dailyReward.spin'
import { exec } from './../../../db'
import { GameUser } from './../../meta/meta.types'
import { getLastSpin, getDailyRewardPrizes, getUserPrize } from "./dailyReward.repo"
describe('daily reward', () => {
  let user: GameUser
  beforeAll(async () => {
    await deleteDataInTestDB()
    await exec('delete from last_spin')
    await exec('delete from game_user')
    user = await getNewSavedFakeUser()
  })
  it('lastSpin toBe(2)', async () => {
    const lastSpin = {game_user_id: user.id, last: (new Date()), days: 2}
    await exec('insert into last_spin set ?', lastSpin)
    const respLastSpin = await getLastSpin(user)
    expect(respLastSpin).not.toBeUndefined()
    expect(respLastSpin?.days).toBe(2)
  })
  it('dailyRewardPrizes toBeArray', async () => {
    const dailyRewardPrizes = await getDailyRewardPrizes()
    expect(dailyRewardPrizes).toBeArray()
  })
  it('userPrize.amount for this user) toBe(30)', async () => {
    const lastSpin = {game_user_id: user.id, last: (new Date()), days: 2}
    await exec('delete from last_spin')
    await exec('insert into last_spin set ?', lastSpin)
    const userPrizes = await getUserPrize(user)
    expect(userPrizes).not.toBeUndefined()
    expect(userPrizes?.amount).toBe(30)
  })
  it('lastSpinDays toBe(2)', async () => {
    const lastSpin = {game_user_id: user.id, last: (new Date()), days: 2}
    await exec('delete from last_spin')
    await exec('insert into last_spin set ?', lastSpin)
    const lastSpinDays = await getLastSpinDays(user)
    expect(lastSpinDays).toBeNumber()
    expect(lastSpinDays).toBe(2)
  })
})