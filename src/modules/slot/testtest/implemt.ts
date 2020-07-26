import { GameUser } from "../../meta/meta.types"
import { getGameUserByDeviceId } from './../../meta/meta-services/meta.service'

export const getUser = async (deviceId = 'fakeUserId'): Promise<GameUser> =>
{
  const user = await getGameUserByDeviceId(deviceId)
  return user
}
