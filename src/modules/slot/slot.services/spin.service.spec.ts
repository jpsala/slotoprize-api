import snakeCase from 'snakecase-keys';
import { fakeUser, GameUser } from './../../meta/meta.types';
import { addGameUser } from '../../meta/meta.repo/gameUser.repo'
import { spin, getBetAndCheckFunds } from './spin.service'

const testUser: GameUser = fakeUser()
it('spin', async () => {
  const multiplier = 1
  testUser.wallet.coins = 0
  const userSnakeCase = snakeCase(testUser)
  const userId = await addGameUser(userSnakeCase)
  testUser.id = userId
  const { bet, enoughCoins } = await getBetAndCheckFunds(multiplier, testUser.wallet.coins)
  console.log('bet, enog', bet, enoughCoins)
  expect(bet).toBeNumber()
  expect(enoughCoins).toBeBoolean()
  const spinData = await spin(testUser.deviceId, 1)
  // console.log('spinData', spinData)
  expect(spinData).toBeObject()
})
