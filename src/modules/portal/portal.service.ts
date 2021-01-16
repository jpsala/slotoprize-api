import camelcaseKeys from "camelcase-keys"
import createHttpError from "http-errors"
import { StatusCodes } from "http-status-codes"
import {v4 as uuid} from "uuid"
import { queryExec, queryOne } from "../../db"
import { getPortalUrl, validateEmail } from "../../helpers"
import { getNewToken, verifyToken } from "../../services/jwtService"
import { getGameUserByDeviceEmail, getGameUserById } from "../meta/meta.repo/gameUser.repo"
import { GameUser } from "../meta/meta.types"
import {sendMail} from "../meta/meta-services/email.service"
import { getSetting } from "../slot/slot.services/settings.service"
import { GameData, GoogleUser, PortalUser } from "./portal.types"

export async function getUserByLoginAndPassword(login: string, password: string): Promise<any> {
  
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return await getUserByWhere(`email = '${login}' and password = '${password}'`)
}

export async function getUserByWhere(where: string): Promise<any> {
  const user = camelcaseKeys(await queryOne(`
      select *
        from game_user_portal up
      where ${where}`)
  )
  if(user) delete user.password
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return user

}

export async function getUserById(id: number): Promise<PortalUser> {

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return await getUserByWhere(`id = ${id}`)
}

export async function addPortalUser(data: Partial<GoogleUser>): Promise<PortalUser>{
  console.log('addPortalUser', data)

  if(!data.email) throw createHttpError(StatusCodes.BAD_REQUEST, 'Email is required')

  if(!validateEmail(data.email)) throw createHttpError(StatusCodes.BAD_REQUEST, 'Invalid email')

  const resp = await queryExec(`
    insert into game_user_portal
    (device_id, password, email, last_name, first_name, image_url) values
    (?, ?, ?, ?, ?, ?)
  `, [data.deviceId || uuid(), uuid().substr(0, 8), data.email, data.familyName || '', data.givenName || data.name, data.imageUrl || ''])

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

export async function loginWithGoogle(loginData: GoogleUser): Promise<GameData>{

  console.log('loginWithGoogle loginData', loginData)
  
  let portalUser = await getPortalUserByEmail(loginData.email)

  let token: string | undefined = undefined

  if(!portalUser){

    const gameUser = await getGameUserByDeviceEmail(loginData.email)
    if(gameUser) {
      console.log('loginWithGoogle: !portalUser, gameUser found', gameUser)
      loginData.deviceId = gameUser.deviceId
    }
    portalUser = await addPortalUser(loginData)
    token = await sendSignUpEmail(portalUser)

  }
  
  console.log('loginWithGoogle: returning portalUser', portalUser )

  return getGameData(portalUser, token)

}

export async function loginWithFacebook(loginData: GoogleUser): Promise<GameData>{

  console.log('loginWithFacebook loginData', loginData)
  
  let portalUser = await getPortalUserByEmail(loginData.email)
  console.log('portalUser', portalUser)
  
  let token: string | undefined = undefined

  if(!portalUser){

    const gameUser = await getGameUserByDeviceEmail(loginData.email)

    if(gameUser) {
      console.log('loginWithFacebook: !portalUser, gameUser found', gameUser)
      loginData.deviceId = gameUser.deviceId
    
    }
    loginData.givenName = (loginData as any).name
    portalUser = await addPortalUser(loginData)
    token = await sendSignUpEmail(portalUser)
  }
  
  console.log('loginWithFacebook: returning portalUser', portalUser )

  return getGameData(portalUser, token)

}

export async function auth(login: string, password: string): Promise<GameData> {

  const user = await getUserByLoginAndPassword(login, password)

  if (!user)
    throw createHttpError(StatusCodes.NOT_FOUND, 'The user in the token was not found in the db')

  return getGameData(user)

}

export async function loginWithToken(loginToken: string): Promise<GameData>{

  const {decodedToken, error} = verifyToken(loginToken)
  if (!decodedToken || error)
    throw createHttpError(StatusCodes.UNAUTHORIZED, 'Error in token')

  const { id } = decodedToken 
  let user = await getUserById(id)

  if (!user){
    const gameUser = await getGameUserById(id)
    if(gameUser) user = gameUserToPortalUser(gameUser)
  }

  if (!user) throw createHttpError(StatusCodes.NOT_FOUND, 'The user in the token was not found in the db')

  return getGameData(user)
  
}
export async function activation(loginToken: string): Promise<GameData>{

  const {decodedToken, error} = verifyToken(loginToken)

  if (!decodedToken || error)
    throw createHttpError(StatusCodes.UNAUTHORIZED, 'Error in token')

  const { id } = decodedToken 
  let user = await getUserById(id)

  if (!user){
    const gameUser = await getGameUserById(id)
    if(gameUser) user = gameUserToPortalUser(gameUser)
  }

  if (!user) throw createHttpError(StatusCodes.NOT_FOUND, 'The user in the token was not found in the db')

  return getGameData(user)
  
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function signUp(loginData: any): Promise<GameData>{
  loginData.givenName = loginData.name
  const gameUser = await getGameUserByDeviceEmail(loginData.email)
  if(gameUser) throw createHttpError(StatusCodes.BAD_REQUEST, 'Email already exists')

  const portalUser = await getPortalUserByEmail(loginData.email)
  if(portalUser) throw createHttpError(StatusCodes.BAD_REQUEST, 'Email already exists')

  const newUser = await addPortalUser(loginData)

  const token = await sendSignUpEmail(newUser)

  return getGameData(newUser, token)

}

async function sendSignUpEmail(newUser: PortalUser) {
  const token = getNewToken({ id: newUser.id, deviceId: newUser.deviceId }) as string
  const emailSupport = await getSetting('emailSupport', 'jpsala+support@gmail.com')
  const url = `${getPortalUrl()}?activation=${token}`
  await sendMail(
    newUser.email,
    'New Sloto Prizes account',
    `
    <div style="
        padding: 30px 50px;
        border-radius: 4px;
        margin: auto;
        width: 503px;
        box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
        background-color: #F3F4F9;"
      >
      <img style='height: 80px; margin-top: -7px; margin-left: -30px; margin-bottom: 30px;'
          src='https://assets.dev.slotoprizes.tagadagames.com/img/logo.png' />
      <h1 style="margin-bottom: 10px;">Bienvenue à Sloto Prizes</h1>

      <hr style="margin-bottom: 40px;">

      <p>Utilisateur: ${newUser.firstName}</p>

      <p>Mot de passe: ${newUser.password}</p>

      <p>Bonne chance !</p>

      <a 
        href="${url}"
        style="
          text-align: center;
          position: relative;

          display: block;
          margin: 0px auto;
          margin-top: 70px;
          overflow: hidden;
          border-width: 0;
          outline: none;
          border-radius: 2px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, .6);
          font-size: 1rem;
          background-color: #0088FF;
          color: white;
          transition: background-color .3s;
          padding: 15px 40px;
          cursor: pointer;
          width: 50px;
        "
        type="button"><span>Jouer</span>
      </a>
    </div>
      `, emailSupport)
  return token
}

async function getGameData(user: PortalUser, token?: string): Promise<GameData>{

  if(!user.id || !user.deviceId || !user.email ) throw createHttpError(StatusCodes.BAD_REQUEST, 'portal.service: getGameData, user missing properties')

  const maxMultiplier = await getSetting('maxMultiplier', '1')
  const _token = token || getNewToken({ id: user.id, deviceId: undefined })
  
  return  {
    user:{
      id: user.id,
      deviceId: user.deviceId,
      email: user.email,
      name: user.firstName
    },
    maxMultiplier: Number(maxMultiplier),
    token: _token
  }
}