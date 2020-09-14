import { INTERNAL_SERVER_ERROR } from 'http-status-codes'
import createHttpError from 'http-errors'
import  {utc}  from 'moment'
import { getSetting } from '../slot.services/settings.service'
import { query, exec } from '../../../db'
import { wsServer, WebSocketMessage } from './../slot.services/webSocket/ws.service'
import { GameUser } from './../../meta/meta.types'

export type UserSpinRegenerationData = {
  userId: number,
  last: Date,
  spins: number,
  spinRegenerationTableId: number,
  dirty: boolean,
  spinsRegenerated: number
}

const usersSpinRegenerationArray: UserSpinRegenerationData[] = []

export async function spinRegenerationInit(): Promise<void>{
  const spinRegenerationRows: UserSpinRegenerationData[] = await query(`
    select gu.id as userId, sr.id as spinRegenerationTableId, sr.lastRegeneration as last, w.spins
      from game_user gu
          left join spins_regeneration sr on gu.id = sr.game_user_id
          left join wallet w on w.game_user_id = gu.id
    `)
  for (const spinRegenerationRow of spinRegenerationRows)
    await validateAndAddUserToUsersArray(spinRegenerationRow)

    initIntervalForSpinRegeneration()
    initIntervalForSavingArrayToDB()
}
async function validateAndAddUserToUsersArray(partialSpinRegenerationData: Partial<UserSpinRegenerationData>, init = true): Promise<void>{
  const spinRegenerationData = partialSpinRegenerationData as UserSpinRegenerationData
  if (!partialSpinRegenerationData?.spinRegenerationTableId) {
    console.log('Adding record in spins_regeneration', partialSpinRegenerationData.userId, partialSpinRegenerationData)
    const resp = await exec(`
      insert into spins_regeneration(game_user_id) values(?)
    `, [spinRegenerationData.userId])
    spinRegenerationData.spinRegenerationTableId = resp.insertId
    if (init) {
      spinRegenerationData.last = new Date()
      spinRegenerationData.spins = 0
      spinRegenerationData.spinsRegenerated = 0
      spinRegenerationData.dirty = false
    }
  }
  usersSpinRegenerationArray.push(spinRegenerationData)
  await updateUserInUsersSpinRegenerationArray(spinRegenerationData)
}
async function updateUserInUsersSpinRegenerationArray(userSpinRegenerationData: UserSpinRegenerationData): Promise<boolean>{
  let lastRegeneration: Date
  let modified = false
  if (!userSpinRegenerationData?.spinRegenerationTableId)
    lastRegeneration = new Date()
  else
    lastRegeneration = userSpinRegenerationData.last ?? new Date()

  const lapseForSpinRegeneration = Number(await getSetting('lapseForSpinRegeneration', 10)) * 1000
  const maxSpinsForSpinRegeneration = Number(await getSetting('maxSpinsForSpinRegeneration', 10))
  const lastMoment = utc(lastRegeneration)
  const nowMoment = utc(new Date())
  const diff = nowMoment.diff(lastMoment.utc())
  if (diff >= lapseForSpinRegeneration && userSpinRegenerationData.spins < maxSpinsForSpinRegeneration) {
    const spinsAmountForSpinRegeneration = Number(await getSetting('spinsAmountForSpinRegeneration', 1))
    const newUserSpinAmount = userSpinRegenerationData.spins + spinsAmountForSpinRegeneration
    modified = true
    await exec(`update spins_regeneration set lastRegeneration = ? where game_user_id = ? `, [
      utc(new Date()).format('YYYY/MM/DD HH:mm:ss'), userSpinRegenerationData.userId
    ])
    const rowInArray = usersSpinRegenerationArray.find(elem => elem.userId === userSpinRegenerationData.userId)
    if(!rowInArray) throw Error('spinRegenerationData not found in usersSpinRegenerationArray')
    rowInArray.last = new Date()
    rowInArray.spins = newUserSpinAmount
    rowInArray.spinsRegenerated = spinsAmountForSpinRegeneration
    await exec(`update spins_regeneration set ? where id = ${userSpinRegenerationData.spinRegenerationTableId}`, {
      id: String(userSpinRegenerationData.spinRegenerationTableId),
      game_user_id: userSpinRegenerationData.userId,
      lastRegeneration: userSpinRegenerationData.last
    })
    // @TODO ver si actualizar abajo o llamar a un método de wallet o gameUser
    await exec(`update wallet set spins = ? where game_user_id = ?`, [
      String(newUserSpinAmount),
      String(userSpinRegenerationData.userId)
    ])
    userSpinRegenerationData.dirty = true
    sendEventToClient(userSpinRegenerationData)
  }
  return modified

}
function sendEventToClient(userSpinRegenerationData: UserSpinRegenerationData)
{
  const msg: WebSocketMessage = {
    code: 200,
    message: 'OK',
    msgType: "spinTimer",
    payload: {
      spins: userSpinRegenerationData.spinsRegenerated,
      pendingMiliseconds: 0
    }
  }
  wsServer.sendToUser(msg, userSpinRegenerationData.userId)
}
export function getUserSpinRegenerationData(userId: number): UserSpinRegenerationData
{
  return usersSpinRegenerationArray.find( row => row.userId === userId) as UserSpinRegenerationData
}
export async function shutDown():Promise<void>{
  console.log('saving spinRegenerationData')
  await saveSpinRegenerationDataToDB()
  console.log('saved spinRegenerationData')
}
async function saveSpinRegenerationDataToDB(){
  for (const row of usersSpinRegenerationArray)
    if(row.dirty){
      console.log('Saving spins regeneration for user %O, spins %O', row.userId, row.spins)
      await exec(`update spins_regeneration set lastRegeneration = ? where game_user_id = ?`,
        [row.last, row.userId])
      row.dirty = false
    }
}
function initIntervalForSavingArrayToDB(): void{
  setInterval(() => void saveSpinRegenerationDataToDB(), 5000)
}
function initIntervalForSpinRegeneration(): void {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  setInterval(async function (): Promise<void>
  {
    await spinRegenerationUsersInArray()
  }, 1000)
  setTimeout(() => void shutDown(), 1000)
}
async function spinRegenerationUsersInArray(): Promise<void>{
  let modified = 0
  for (const spinRegenerationData of usersSpinRegenerationArray) {
    const resp = await updateUserInUsersSpinRegenerationArray(spinRegenerationData)
    if (resp) modified = modified++
  }
  if (modified > 0) console.log('intervalForSpinRegeneration', modified )
}
export function userChanged(user: GameUser, spins: number): void{
  const userSpinRegenrationRecord = usersSpinRegenerationArray.find( elem => elem.userId === user.id)
  if(!userSpinRegenrationRecord) throw createHttpError(INTERNAL_SERVER_ERROR, 'User does not exists in usersSpinRegenerationArray')
  userSpinRegenrationRecord.spins = spins
  userSpinRegenrationRecord.dirty = true
  console.log('spinRegenetarion: userChanged()', user.deviceId)
}
export async function userAdded(user: GameUser, spins: number): Promise<void>{
  const userSpinRegenrationRecordInArray = usersSpinRegenerationArray.find( elem => elem.userId === user.id)
  if(userSpinRegenrationRecordInArray) throw createHttpError(INTERNAL_SERVER_ERROR, 'User already  exists in usersSpinRegenerationArray')
  const userSpinRegenrationRecord: Partial<UserSpinRegenerationData> = {
    userId: user.id, spins: spins, dirty: true, last: new Date()
  }
  console.log('spinRegenetarion: userAdded()', user.deviceId)
  await validateAndAddUserToUsersArray(userSpinRegenrationRecord, false)
}
/*  PseudoCode

spins_regeneration: table = {userId, lastRegeneration(dataTime)}

settings: {lapseForSpinRegeneration, spinsAmountForSpinRegeneration, maxSpinsForSpinRegeneration}

users: array {userId, last, spins, spinsRegenerationTableId}

notes:
  when adding or deleting a user I have to add it or delete in from spins_regeneration table
  when spins change in user wallet I have to call spinsChangeInUserWallet with the user

init
{
  for each user in db
  {
    call addUserToUsersArray with user
  }
}

addUserToUsersArray
{
  create a record in spins_regeneration table if there is none for this user
  add user to users array
  call updateUsersArray with user
}

updateUsersArray
{
  calc minutesFromLastRegenerationUntilNow
  if minutesFromLastRegenerationUntilNow >= lapseConfigurationForSpinRegeneration and userSpins <= maxSpinsForSpinRegeneration{
    multiplier = absolute value of minutesFromLastRegenerationUntilNow div lapseConfigurationForSpinRegeneration
    spinsToAdd = spinsAmountConfigurationForSpinRegeneration * multiplier
    add spinsToAdd to users element in array
    add spinsToAdd to users users wallet
    update user in spins_regeneration table
  }
}

spinsChangeInUserWallet
{
  call addUserToUsersArray with user
}

time interval 1min{
  for each element {
    call updateUsersArray with user
  }
}


*/