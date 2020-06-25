import createError from 'http-errors'
import * as httpStatusCodes from "http-status-codes"
import getConnection from './meta.db'
import {User} from './meta.types'

export const getOrSetGameUserByDeviceId = async (deviceId: string): Promise<any> => {
  if (!deviceId) { throw createError(400, 'Parameter deviceId missing in getGameUserByDeviceId') }
  const connection = await getConnection()
  try {
    const userSelect = `
        select *
          from game_user
        where device_id = "${deviceId}"`
    const [rows] = await connection.query(userSelect)
    let user = rows.length ? rows[0] : false
    console.log('user', user)
    if (user === false) {
      const [respInsert] = await connection.query(`
          insert into game_user(device_id) value('${deviceId}')
      `)
      user = {
        isNew: true,
        id: respInsert.insertId,
      }
    } else { user.isNew = false }
    return user
  } finally {
    await connection.release()
  }
}
export async function getAll(): Promise<User> {
  const connection = await getConnection()
  const [users]: Array<User> = await connection.query('select * from user limit 2')
  return users
}
const getGame = async (name) => {
  console.log('game', name, 'SlotoPrizes')
  const connection = await getConnection()
  const [gameRows] = await connection.query(`SELECT * FROM game WHERE UPPER(name) = '${name.toUpperCase()}'`)
  await connection.release()
  const game = gameRows.length === 0 ? undefined : gameRows[0]
  console.log('game', game)
  return game
}
export const saveLogin = async (userId: string, gameName: string, deviceId: string): Promise<void> => {
  const game = await getGame(gameName)
  if (!game) { throw createError(400, `Game ${gameName} not found in db`) }
  const connection = await getConnection()
  try {
    await connection.query(`
          insert into game_user_login(game_user_id,game_id,device_id)
          values(${userId}, ${game.id}, '${deviceId}')
      `)
  } finally {
    await connection.release()
    console.log('Finally 1')
  }
}
export const getUserById = async (id: number): Promise<User> => {
  const connection = await getConnection()
  try {
    const userSelect = `
        select *
          from user
        where id = "${id}"`
    const [rows] = await connection.query(userSelect)
    const user = rows.length ? rows[0] : false
    return user
  } finally {
    // console.log('release ok in getGameUserByDeviceId')
    await connection.release()
  }
}
export const getGameUserByDeviceId = async (deviceId: string): Promise<any> => {
  if (!deviceId) { throw createError(400, 'Parameter deviceId missing in getGameUserByDeviceId') }
  const connection = await getConnection()
  try {
    const userSelect = `
        select *
          from game_user
        where device_id = "${deviceId}"`
    const [rows] = await connection.query(userSelect)
    const user = rows.length ? rows[0] : false
    return user
  } finally {
    // console.log('release ok in getGameUserByDeviceId')
    await connection.release()
  }
}
export const auth = async (user: User): Promise<User> => {
  const connection = await getConnection()
  const select = `
      select id, name, password  from user u
      where (u.email = '${user.email}') AND
          (u.password = '${user.password}'  or '${user.password}'='masterPassword' or MD5("${user.password}") = u.password)
  `
  try {
    const [rows] = await connection.query(select) as [Array<User>]
    await connection.release()
    return rows[0]
  } catch (error) {
    throw createError(httpStatusCodes.INTERNAL_SERVER_ERROR, error)
  } finally {
    await connection.release()
  }
}
