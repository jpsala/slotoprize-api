import camelcaseKeys from "camelcase-keys"
import createHttpError from "http-errors"
import { StatusCodes } from "http-status-codes"
import {v4 as uuid} from "uuid"
import snakecaseKeys from "snakecase-keys"
import { parseISO, format } from 'date-fns'
import { queryExec, queryOne } from "../../db"
import { getPortalUrl, validateEmail } from "../../helpers"
import { getNewToken, verifyToken } from "../../services/jwtService"
import { addGameUser, getGameUserByDeviceEmail, getGameUserById } from "../meta/meta.repo/gameUser.repo"
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

export async function getProfile(id: number): Promise<any>{


    const data = await queryOne(`
      select * from game_user_portal p
        inner join game_user g on g.device_id = p.device_id
      where p.id = ${id}
    `)

    if (!data) throw createHttpError(StatusCodes.NOT_FOUND, 'The user with this ID')
    console.log('data', JSON.stringify(data, null, 2))

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return camelcaseKeys(data)
 
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function postProfile(data: any): Promise<any>{
  delete data.imageUrl
  delete data.createdAt
  delete data.modifiedAt
  delete data.isDev
  delete data.adsFree
  delete data.sendWinJackpotEventWhenProfileFilled
  const birthDateISO = parseISO(data.birthDate)
  data.birthDate = format(birthDateISO, 'yyyy-MM-dd HH:mm:ss')
  console.log('data', data)
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  const resp = await queryExec(`update game_user set ? where id = ${data.id}`, snakecaseKeys(data))
  console.log('resp', resp)

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return camelcaseKeys(data)
 /* address: ""
    adsFree: 0
    agreements: 0
    banned: 0
    birthDate: "1900-01-01T04:16:48.000Z"
    city: ""
    country: ""
    createdAt: "2021-01-24T23:18:56.000Z"
    deviceId: "6373ad51-cfa8-4ccf-b6d3-8fa9f09c77f9"
    deviceModel: ""
    deviceName: ""
    devicePlataform: ""
    email: "jpsala@gmail.com"
    firstName: "Juan Pablo"
    id: 106553
    imageUrl: "https://lh3.googleusercontent.com/a-/AOh14GilC43fO5FPldJ6Hp7rOCZ070u4dhmBMpezi4sT3A=s96-c"
    isDev: 0
    languageCode: "fr-FR"
    lastName: "Sala"
    modifiedAt: "2021-01-24T23:18:56.000Z"
    password: ""
    phoneNumber: ""
    sendWinJackpotEventWhenProfileFilled: null
    state: ""
    title: ""
    tutorialComplete: 0
    zipCode: "" */
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

  const gameUser = await getGameUserByDeviceEmail(user.email)
  if(!gameUser){
    const newUser: Partial<GameUser> = {
      deviceId: user.deviceId,
      lastName: user.lastName,
      firstName: user.firstName,
      email: user.email
    }
    const resp = await addGameUser(newUser as GameUser)
    console.log('getGameData addGameUser', resp)
  }
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