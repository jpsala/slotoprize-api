import createError from 'http-errors'

import getConnection from './meta.db'

export const getOrSetUserByDeviceId = async (deviceId: string): Promise<any> => {
  if (!deviceId) { throw createError(400, 'Parameter deviceId missing in getUserByDeviceId') }
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
export async function getAll(): Promise<any[]> {
  const connection = await getConnection()
  const [users]: any = await connection.query('select * from user limit 2')
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
export const getUserByDeviceId = async (deviceId: string): Promise<any> => {
  if (!deviceId) { throw createError(400, 'Parameter deviceId missing in getUserByDeviceId') }
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
    // console.log('release ok in getuserbydeviceid')
    await connection.release()
  }
}

