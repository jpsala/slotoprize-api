import getMetaConnection from '../meta/meta.db'
import getConnection from './db.slot'
import * as slotCommands from './slot.commands'

export const gameInit = async (): Promise<any> => {
  const conn = await getConnection()
  return slotCommands.gameInitCmd(conn)
}
export const getProfile = async (deviceId: string): Promise<any> => {
  const conn = await getMetaConnection()
  return slotCommands.getProfileCmd(conn, deviceId)
}
export const setProfile = async (deviceId: string, data: any = {}): Promise<any> => {
  const conn = await getMetaConnection()
  return slotCommands.setProfileCmd(conn, deviceId, data)
}
export const spin = async (): Promise<any> => {
  const conn = await getConnection()
  const spinResults = await slotCommands.spinCmd(conn)
  const win = slotCommands.isWin(spinResults)
  console.log('spin -> spinesults', spinResults, win)
  return {symbolsData: spinResults, isWin: win}
}
