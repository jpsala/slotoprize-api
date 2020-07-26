import { fakeUser } from './../../meta/meta.types'
import { getUser } from './implemt'

describe('mocking GameUser repo getGameUserByDeviceId', () =>
{
  it('user is not a mock yet, deviceId is fakDevice1', async () =>
  {
    const user = await getUser('fakeDevice1')
    expect(user).not.toBeUndefined()
    expect(user).toHaveProperty('deviceId')
  })
  it('User is a mock, device id is thisIsMyFakeDeviceID', async () =>
  {
    const mockUser = fakeUser({ deviceId: 'thisIsMyFakeDeviceID' })
    jest.mock('./../../meta/meta-services/meta.service', () =>
    {
      return {
        getGameUserByDeviceId()
        {
          return mockUser
        }
      }
    })

    const deviceId = 'fakeDevice1'
    const user = await getUser(deviceId)

    expect(user).not.toBeUndefined()
  })
})
