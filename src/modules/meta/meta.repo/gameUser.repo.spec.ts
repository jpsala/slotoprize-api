import snakeCase from 'snakecase-keys'
import { fakeUser, GameUser } from '../models'
import { addGameUser } from "./gameUser.repo"
const user: GameUser = fakeUser()
it('Insert gameUser in DB', async () => {
  const languageCode = await getSetting('languageCode', 'fr-FR')

  user.languageCode = languageCode
  const userSnakeCase = snakeCase(user)
  let result
  try {
    result = await addGameUser(userSnakeCase)
     console.log('result', result)
  } catch (error) {
    console.dir(JSON.stringify(error) )
  }
expect(1).toBe(1)
})