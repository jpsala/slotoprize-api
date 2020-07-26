jest.mock('./testModule', () =>
{
  return {
    getSuperUser()
    {
      return 'hola'
    }
  }
})
import { getSuperUser } from "./testModule"

describe('mocking GameUser repo getGameUserByDeviceId', () =>
{
  it('hola', async () =>
  {
    const deviceId = 'fakeDevice1'
    const user = await getSuperUser(deviceId)
    console.log('user', user)
    expect(user).not.toBeUndefined()
  })
})