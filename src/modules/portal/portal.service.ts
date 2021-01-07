import camelcaseKeys from "camelcase-keys"
import createHttpError from "http-errors"
import { StatusCodes } from "http-status-codes"
import {v4 as uuid} from "uuid"
import { queryOne } from "../../db"
import { getNewToken, verifyToken } from "../../services/jwtService"
import { addGameUser, getGameUserByDeviceEmail, getGameUserByDeviceId, getGameUserById } from "../meta/meta.repo/gameUser.repo"
import { GameUser } from "../meta/meta.types"
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
  return camelcaseKeys(await queryOne(`
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

export async function loginWithToken(loginToken: string): Promise<{user: Omit<PortalUser, 'password'> | GameUser | undefined, token: string}>{
  console.log('token', loginToken)
  const {decodedToken, error} = verifyToken(loginToken)
  console.log('decodedToken, error', decodedToken, error)
  if (!decodedToken || error)
    throw createHttpError(StatusCodes.UNAUTHORIZED, 'The user in the token was not found in the db')
    const { id } = decodedToken 
    let user: Omit<PortalUser, 'password'> | GameUser | undefined = await getUserById(id)
    if (!user){
      const gameUser = await getGameUserById(id)
      if(gameUser) user = gameUserToPortalUser(gameUser)
    }
    if (!user)
    throw createHttpError(StatusCodes.NOT_FOUND, 'The user in the token was not found in the db')
  const token = getNewToken({ id: user.id, deviceId: undefined })
  return {user, token}
  
}
export async function createGameUserFromPortalUser(loginData: any): Promise<any>{
  const userData = {
    "id": "100258850875396198913",
    "name": "Juan Pablo",
    "givenName": "Juan",
    "familyName": "Pablo",
    "imageUrl": "https://lh6.googleusercontent.com/-j82JnQ8Rndk/AAAAAAAAAAI/AAAAAAAAAAA/AMZuuckKcbXpWjiCiax5T5ZjLmJX3167Hw/s96-c/photo.jpg",
    "email": "jpsala.alt@gmail.com"
  }
  const gameUser: Partial<GameUser> = {
    firstName: loginData.name,
    lastName: loginData.familyName,
    deviceId: uuid(),
    email: loginData.email
  }
  return await addGameUser(gameUser as GameUser)
}

export async function loginWithGoogle(loginData: any): Promise<any>{
  console.log('token', loginData)
  let user = await getGameUserByDeviceEmail(loginData.email)
  if(!user) user = await createGameUserFromPortalUser(loginData)
  console.log('user', )
  const token = getNewToken({ id: user.id, deviceId: undefined })
  const portalUser = gameUserToPortalUser(user)
  return {user: portalUser, token}

}

export function gameUserToPortalUser(gameUser: GameUser): Omit<PortalUser, 'password'> {
  const portalUser: Omit<PortalUser, 'password'> = {
    deviceId: gameUser.deviceId,
    id: gameUser.id,
    login: gameUser.email,
    name: gameUser.firstName.concat(', ', gameUser.lastName),
    email: gameUser.email
  }
  return portalUser
}

