import { utc, } from 'moment'
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from 'http-status-codes'
import createHttpError from 'http-errors'

import { getSetting } from '../slot.services/settings.service'
import { query, queryExec } from '../../../db'
import { getGameUserById } from '../../meta/meta.repo/gameUser.repo'
import { wsServer, WebSocketMessage } from './../slot.services/webSocket/ws.service'
import { GameUser } from './../../meta/meta.types'

export type UserSpinRegenerationData = {
  userId: number,
  last: Date | string,
  spins: number,
  spinRegenerationTableId: number,
  dirty: boolean,
  spinsRegenerated: number
}
let usersSpinRegenerationArray: UserSpinRegenerationData[] = []
let spinsAmountForSpinRegeneration: number
let lapseForSpinRegeneration
let maxSpinsForSpinRegeneration
let spinRegenerationTimoutHandle
let intervalForSavingArrayToDBHandle
export async function spinRegenerationInit(): Promise<void>
{
  usersSpinRegenerationArray = []
  lapseForSpinRegeneration = Number(await getSetting('lapseForSpinRegeneration', '10')) * 1000
  maxSpinsForSpinRegeneration = Number(await getSetting('maxSpinsForSpinRegeneration', '10'))

  // await exec(`update wallet set spins=0 where game_user_id = 583`)
  spinsAmountForSpinRegeneration = Number(await getSetting('spinsAmountForSpinRegeneration', '1'))

  const spinRegenerationRows: UserSpinRegenerationData[] = await query(`
    select gu.id as userId, sr.id as spinRegenerationTableId,
           sr.lastRegeneration as last, w.spins, ${spinsAmountForSpinRegeneration} as spinsRegenerated
      from game_user gu
          left join spins_regeneration sr on gu.id = sr.game_user_id
          left join wallet w on w.game_user_id = gu.id
    `)
  for (const spinRegenerationRow of spinRegenerationRows)
    await validateAndAddUserToUsersArray(spinRegenerationRow)

  initIntervalForSpinRegeneration()
  initIntervalForSavingArrayToDB()
  await spinRegenerationUsersInArray()
}
async function validateAndAddUserToUsersArray(partialSpinRegenerationData: Partial<UserSpinRegenerationData>, initSpinRegenerationData = true): Promise<void>{
  const spinRegenerationData = partialSpinRegenerationData as UserSpinRegenerationData
  if (!partialSpinRegenerationData?.spinRegenerationTableId) {
    console.log('Adding record in spins_regeneration', partialSpinRegenerationData.userId, partialSpinRegenerationData, utc(new Date()).format('YYYY-MM-DD HH:mm:ss'))
    const resp = await queryExec(`insert into spins_regeneration(game_user_id) values(?)`, [spinRegenerationData.userId])
    spinRegenerationData.spinRegenerationTableId = resp.insertId
    if (initSpinRegenerationData) {
      spinRegenerationData.last = new Date()
      // spinRegenerationData.last = utc(new Date()).format('YYYY-MM-DD HH:mm:ss')
      spinRegenerationData.spins = 0
      spinRegenerationData.spinsRegenerated = 0
      spinRegenerationData.dirty = false
    }
  }
  usersSpinRegenerationArray.push(spinRegenerationData)
  await updateUserInUsersSpinRegenerationArray(spinRegenerationData)
}
async function updateUserInUsersSpinRegenerationArray(userSpinRegenerationData: UserSpinRegenerationData): Promise<boolean>{
  let lastRegeneration: Date | string
  let modified = false
  const rowInArray = usersSpinRegenerationArray.find(elem => elem.userId === userSpinRegenerationData.userId)

  if (!userSpinRegenerationData?.spinRegenerationTableId){
    lastRegeneration = new Date()
    console.log('updateUserInUsersSpinRegenerationArray !userSpinRegenerationData?.spinRegenerationTableId mal!' )
  } else
    {lastRegeneration = userSpinRegenerationData.last ?? new Date()}

  const { diff, lastMoment, nowMoment } = getDiff(lastRegeneration)

  if (diff >= lapseForSpinRegeneration && userSpinRegenerationData.spins < maxSpinsForSpinRegeneration) {
    // console.log('Update user %o spins %o last %o now %o diff %o', userSpinRegenerationData.userId,
    //              userSpinRegenerationData.spins, lastMoment.format('YYYY-MM-DD HH:mm:ss'),
    //              nowMoment.format('YYYY-MM-DD HH:mm:ss'),  diff / 1000)
    console.log('userSpinRegenerationData.spins %O, maxSpinsForSpinRegeneration %O', userSpinRegenerationData.spins, maxSpinsForSpinRegeneration)
    console.log('Update user %o spins %o last spin %o now %o rest %o', userSpinRegenerationData.userId, userSpinRegenerationData.spins, lastMoment.format('YYYY-MM-DD HH:mm:ss'), nowMoment.format('YYYY-MM-DD HH:mm:ss'),  `${diff / 1000} Secs`)
    const newUserSpinAmount = userSpinRegenerationData.spins + spinsAmountForSpinRegeneration
    modified = true
    await queryExec(`update spins_regeneration set lastRegeneration = ? where game_user_id = ? `, [
      nowMoment.format('YYYY/MM/DD HH:mm:ss'), userSpinRegenerationData.userId
    ])

    if(!rowInArray) throw Error('spinRegenerationData not found in usersSpinRegenerationArray')
    rowInArray.last = new Date()
    rowInArray.spins = newUserSpinAmount
    rowInArray.spinsRegenerated = spinsAmountForSpinRegeneration
    await queryExec(`update spins_regeneration set ? where id = ${userSpinRegenerationData.spinRegenerationTableId}`, {
      id: String(userSpinRegenerationData.spinRegenerationTableId),
      game_user_id: userSpinRegenerationData.userId,
      lastRegeneration: userSpinRegenerationData.last
    })
    // TODO ver si actualizar abajo o llamar a un método de wallet o gameUser
    await queryExec(`update wallet set spins = ? where game_user_id = ?`, [
      String(newUserSpinAmount),
      String(userSpinRegenerationData.userId)
    ])
    userSpinRegenerationData.dirty = true
    sendEventToClient(userSpinRegenerationData)
  }
  return modified

}
function getDiff(lastRegeneration: string | Date)
{
  const lastMoment = utc(lastRegeneration)
  const nowMoment = utc(new Date())
  const diff = nowMoment.diff(lastMoment.utc())
  return {diff, lastMoment, nowMoment, humanDiff: `${diff / 1000} secs`}
}
function sendEventToClient(userSpinRegenerationData: UserSpinRegenerationData)
{
  const msg: WebSocketMessage = {
    code: 200,
    message: 'OK',
    msgType: "spinTimer",
    payload: {
      spins: userSpinRegenerationData.spinsRegenerated,
      spinsInWallet: userSpinRegenerationData.spins,
      pendingSeconds: 0
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
      await queryExec(`update spins_regeneration set lastRegeneration = ? where game_user_id = ?`,
        [row.last, row.userId])
      row.dirty = false
    }
}
function initIntervalForSavingArrayToDB(): void{
  clearInterval(intervalForSavingArrayToDBHandle)
  intervalForSavingArrayToDBHandle = setInterval(() => void saveSpinRegenerationDataToDB(), 5000)
}
function initIntervalForSpinRegeneration(): void {
  clearInterval(spinRegenerationTimoutHandle)
  spinRegenerationTimoutHandle = setInterval(function (): void
  {
    void spinRegenerationUsersInArray()
  }, 1000)
}
async function spinRegenerationUsersInArray(): Promise<void>
{
  // let modified = 0
  for (const spinRegenerationData of usersSpinRegenerationArray)
    await updateUserInUsersSpinRegenerationArray(spinRegenerationData)
}
export async function testUser39(spins = 1):Promise<void> {
  const user = await getGameUserById(39)
  if(!user) throw createHttpError(BAD_REQUEST, 'User not found in testUser39')
  userChanged(user , spins)
}
export function userChanged(user: GameUser, spins: number): void{

  const userSpinRegenrationRecord = usersSpinRegenerationArray.find( elem => elem.userId === user.id)
  if(!userSpinRegenrationRecord) throw createHttpError(INTERNAL_SERVER_ERROR, 'User does not exists in usersSpinRegenerationArray')

  if(userSpinRegenrationRecord.spins >= maxSpinsForSpinRegeneration)
    userSpinRegenrationRecord.last = new Date()

  const diff = getDiff(userSpinRegenrationRecord.last)
  console.log(`spin.regeneration.repo - userChanged() new spins %o old spins %o last %o, now %o, diff %o`,
    spins, userSpinRegenrationRecord.spins, diff.lastMoment.format('YYYY-MM-DD HH:mm:ss'),
    diff.nowMoment.format('YYYY-MM-DD HH:mm:ss'), diff.humanDiff)

  userSpinRegenrationRecord.spins = spins
  userSpinRegenrationRecord.dirty = true


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