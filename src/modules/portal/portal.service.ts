import camelcaseKeys from "camelcase-keys"
import createHttpError from "http-errors"
import { StatusCodes } from "http-status-codes"
import { queryOne } from "../../db"
import { getNewToken, verifyToken } from "../../services/jwtService"
import { PortalUser } from "./portal.types"

export async function auth(login: string, password: string): Promise<any> {

  const user = await getUserByLoginAndPassword(login, password)

  if (!user)
    throw createHttpError(StatusCodes.NOT_FOUND, 'The user in the token was not found in the db')

  const token = getNewToken({ id: user.id, deviceId: undefined })

  return {user, token}

}

export async function getUserByLoginAndPassword(login: string, password: string): Promise<any> {
  
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return await getUserByWhere(`up.login = '${login}' and up.password = '${password}'`)
}

export async function getUserByWhere(where: string): Promise<any> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return (await queryOne(`
      select up.id as id, gu.id as game_user_id,
          case
              when (gu.first_name && gu.last_name) then concat( gu.first_name, ' ', gu.last_name)
              when (gu.first_name) then gu.first_name
              when (gu.last_name) then gu.last_name
              else gu.device_id
          end as name, gu.email , gu.device_id
        from game_user_portal up
          inner join game_user gu on gu.device_id = up.device_id
      where ${where}`)
  )
}

export async function addUser(login: string, password: string): Promise<any> {}

export async function getUserById(id: number): Promise<PortalUser> {

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return await getUserByWhere(`up.id = ${id}`)


}

export async function loginWithToken(loginToken: string): Promise<{user: PortalUser, token: string}>{
  console.log('token', loginToken)
  const {decodedToken, error} = verifyToken(loginToken)
  console.log('decodedToken, error', decodedToken, error)
  if (!decodedToken || error)
    throw createHttpError(StatusCodes.UNAUTHORIZED, 'The user in the token was not found in the db')
    const { id } = decodedToken 
    const user = await getUserById(id)
    if (!user)
    throw createHttpError(StatusCodes.NOT_FOUND, 'The user in the token was not found in the db')
  const token = getNewToken({ id: user.id, deviceId: undefined })
  return {user, token}

}