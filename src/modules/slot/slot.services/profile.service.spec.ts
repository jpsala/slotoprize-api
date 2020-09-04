import * as gameUserRepo from '../../meta/meta.repo/gameUser.repo'
import { fakeUser } from './../../meta/meta.types'
import { getProfile } from "./profile.service"

describe('mocking GameUser repo getGameUserByDeviceId', () =>
{
  it('getProfile', async () =>
  {
    const mockUser = fakeUser({ deviceId: 'thisIsMyFakeDeviceID' })
    const getGameUserByIdMocked = jest.spyOn(gameUserRepo, 'getGameUserByDeviceId').mockImplementation(()=>{return Promise.resolve(mockUser)})
    const deviceId = 'fakeDevice1'
    const profile = await getProfile(deviceId)
    getGameUserByIdMocked.mockRestore()
    // console.log('user', profile)
    expect(profile).not.toBeUndefined()
    expect(profile).toHaveProperty('id')
    expect(profile).toHaveProperty('firstName')
    expect(profile).toHaveProperty('lastName')
    expect(profile).toHaveProperty('wallet')
    expect(profile.wallet).toHaveProperty('coins')
  })
})
