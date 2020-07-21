import { getNewSavedFakeUser } from '../../../meta/meta.repo/gameUser.repo'
import { GameUser } from './../../../meta/meta.types'
import { getLastSpin } from "./dailyReward.spin"
describe('daily reward', () => {
  let user: GameUser
  beforeAll(async () => {
    user = await getNewSavedFakeUser()
  })
  it('last spin date', () => {
    const respLastSpin = getLastSpin(user)
    expect(respLastSpin).not.toBeUndefined()
  })
})