import camelcaseKeys from "camelcase-keys"
import createHttpError from "http-errors"
import { StatusCodes } from "http-status-codes"
import {v4 as uuid} from "uuid"
import { queryExec, queryOne } from "../../db"
import { validateEmail } from "../../helpers"
import { getNewToken, verifyToken } from "../../services/jwtService"
import { getGameUserByDeviceEmail, getGameUserById } from "../meta/meta.repo/gameUser.repo"
import { GameUser } from "../meta/meta.types"
import {sendMail} from "../meta/meta-services/email.service"
import { getSetting } from "../slot/slot.services/settings.service"
import { PortalUser } from "./portal.types"
type GoogleUser = {
  id: number,
  name:string,
  givenName:string,
  familyName:string,
  imageUrl:string,
  email:string,
  deviceId?: string
}

export async function getUserByLoginAndPassword(login: string, password: string): Promise<any> {
  
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return await getUserByWhere(`up.login = '${login}' and up.password = '${password}'`)
}

export async function getUserByWhere(where: string): Promise<any> {
  const user = camelcaseKeys(await queryOne(`
      select *
        from game_user_portal up
      where ${where}`)
  )
    delete user.password
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return user

}

export async function getUserById(id: number): Promise<PortalUser> {

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return await getUserByWhere(`up.id = ${id}`)
}

export async function addPortalUser(data: Partial<GoogleUser>): Promise<PortalUser>{
  console.log('addPortalUser', data)

  if(!data.email) throw createHttpError(StatusCodes.BAD_REQUEST, 'Email is required')

  if(!validateEmail(data.email)) throw createHttpError(StatusCodes.BAD_REQUEST, 'Invalid email')

  const resp = await queryExec(`
    insert into game_user_portal
    (device_id, password, email, last_name, first_name, image_url) values
    (?, ?, ?, ?, ?, ?)
  `, [data.deviceId || uuid(), uuid(), data.email, data.familyName || '', data.givenName, data.imageUrl || ''])

  const portalUser = camelcaseKeys(await queryOne('select * from game_user_portal where id = ?', [resp.insertId]))

  return portalUser as PortalUser
  
}

export function gameUserToPortalUser(gameUser: GameUser):PortalUser {
  const portalUser: PortalUser = {
    deviceId: gameUser.deviceId,
    firstName: gameUser.firstName || "",
    lastName: gameUser.lastName || "",
    email: gameUser.email || "",
    password: uuid()
  }
  return portalUser
}

export async function getPortalUserByEmail(email: string): Promise<PortalUser | undefined>{
  return camelcaseKeys(await queryOne('select * from game_user_portal where email = ?', [email])) as PortalUser
}

export async function loginWithGoogle(loginData: GoogleUser): Promise<any>{

  console.log('loginWithGoogle loginData', loginData)
  
  let portalUser = await getPortalUserByEmail(loginData.email)
  console.log('portalUser', portalUser)
  
  if(!portalUser){
    const gameUser = await getGameUserByDeviceEmail(loginData.email)
    if(gameUser) {
      console.log('loginWithGoogle: !portalUser, gameUser found', gameUser)
      loginData.deviceId = gameUser.deviceId
    }
    portalUser = await addPortalUser(loginData)
    const emailSupport = await getSetting('emailSupport', 'jpsala+support@gmail.com')
    const sended = await sendMail(portalUser.email, 'New Sloto Prizes account', 'Your password is: ' + portalUser.password, emailSupport)
    console.log('email sended', sended)
  }
  
  console.log('loginWithGoogle: returning portalUser', portalUser )

  const token = getNewToken({ id: portalUser.id, deviceId: portalUser.deviceId })
  
  return {user: portalUser, token}

}

export async function auth(login: string, password: string): Promise<any> {

  const user = await getUserByLoginAndPassword(login, password)

  if (!user)
    throw createHttpError(StatusCodes.NOT_FOUND, 'The user in the token was not found in the db')

  const token = getNewToken({ id: user.id, deviceId: undefined })

  return {user, token}

}

export async function loginWithToken(loginToken: string): Promise<{user: Omit<PortalUser, 'password'> | GameUser | undefined, token: string}>{

  const {decodedToken, error} = verifyToken(loginToken)
  if (!decodedToken || error)
    throw createHttpError(StatusCodes.UNAUTHORIZED, 'Error in token')

  const { id } = decodedToken 
  let user: Omit<PortalUser, 'password'> | GameUser | undefined = await getUserById(id)

  if (!user){
    const gameUser = await getGameUserById(id)
    if(gameUser) user = gameUserToPortalUser(gameUser)
  }

  if (!user) throw createHttpError(StatusCodes.NOT_FOUND, 'The user in the token was not found in the db')

  const token = getNewToken({ id: user.id, deviceId: undefined })

  return {user, token}
  
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function signUp(loginData: any): Promise<any>{
  loginData.givenName = loginData.name
  const gameUser = await getGameUserByDeviceEmail(loginData.email)
  if(gameUser) throw createHttpError(StatusCodes.BAD_REQUEST, 'Email already exists')

  const portalUser = await getPortalUserByEmail(loginData.email)
  if(portalUser) throw createHttpError(StatusCodes.BAD_REQUEST, 'Email already exists')

  const newUser = await addPortalUser(loginData)
  console.log('newUSer', newUser)
  const token = getNewToken({ id: newUser.id, deviceId: undefined })
  const emailSupport = await getSetting('emailSupport', 'jpsala+support@gmail.com')
  const sended = await sendMail(newUser.email, 'New Sloto Prizes account', 'Your password is: ' + newUser.password, emailSupport)
  console.log('Email sended', sended)

  return {user: newUser, token}

}
