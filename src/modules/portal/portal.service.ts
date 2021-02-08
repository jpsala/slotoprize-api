import camelcaseKeys from "camelcase-keys"
import createHttpError from "http-errors"
import { StatusCodes } from "http-status-codes"
import {v4 as uuid} from "uuid"
import snakecaseKeys from "snakecase-keys"
import { parseISO, format } from 'date-fns'
import { query, queryExec, queryOne, queryScalar } from "../../db"
import { getAssetsUrl, getPortalUrl, validateEmail } from "../../helpers"
import { getNewToken, verifyToken } from "../../services/jwtService"
import { addGameUser, getGameUserByDeviceEmail, getGameUserByDeviceId, getGameUserById } from "../meta/meta.repo/gameUser.repo"
import { GameUser, RafflePrizeData } from "../meta/meta.types"
import {sendMail} from "../meta/meta-services/email.service"
import { getSetting } from "../slot/slot.services/settings.service"
import { getRaffleLocalizationData } from "../../modules/meta/meta.repo/raffle.repo"
import { CardCollectionsDataCL, CollectibleCardSetDataCL, getAtlasForCollectibleCardSets, CollectibleCardsTradeDataCL, getCardSetClaimed, CollectibleCardDataCL } from "../slot/slot.services/card.service"
import { chestToChestCL, getPremiumChest, getRegularChest } from "../slot/slot.services/chest.service"
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
    throw createHttpError(StatusCodes.NOT_FOUND, 'Impossible de se connecter')

  return getGameData(user)

}

export async function loginWithToken(loginToken: string): Promise<GameData>{

  const {decodedToken, error} = verifyToken(loginToken)
  if (!decodedToken || error)
    throw createHttpError(StatusCodes.UNAUTHORIZED, 'Impossible de se connecter')

  const { id } = decodedToken 
  let user = await getUserById(id)

  if (!user){
    const gameUser = await getGameUserById(id)
    if(gameUser) user = gameUserToPortalUser(gameUser)
  }

  if (!user) throw createHttpError(StatusCodes.NOT_FOUND, 'Impossible de se connecter')

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

  if (!user) throw createHttpError(StatusCodes.NOT_FOUND, 'Impossible de se connecter')

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
export async function postPassword({id, password}: {id: number, password: string}): Promise<any>{
  const portalId = await queryScalar(`
    select p.id 
      from game_user g
        inner join game_user_portal p on p.device_id = g.device_id
    where g.id = ${id}`)
  const resp = await queryExec(`update game_user_portal set password = ? where id = ?`, [password, portalId])
  console.log('resp', resp)
  return resp
}

export async function postForgotPassword(email: string): Promise<void>{
  const password = await queryScalar(`
    select p.password 
      from game_user g
        inner join game_user_portal p on p.device_id = g.device_id
    where g.email = ?`, [email])
  console.log('portalId', password)
  
  if(!password) throw createHttpError(StatusCodes.BAD_REQUEST, 'EmailEmail non trouvé')

  const emailSupport = await getSetting('emailSupport', 'jpsala+support@gmail.com')
  await sendMail(
    email,
    'Votre mot de passe en Slotoprizes',
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
      <h1 style="margin-bottom: 10px;">Votre mot de passe en Slotoprizes</h1>

      <hr style="margin-bottom: 40px;">

      <p>Mot de passe: ${password}</p>

      <p>Bonne chance !</p>


    </div>
      `, emailSupport)
}

export async function postEmail({id, email}: {id: number, email: string}): Promise<any>{
  const portalId = await queryScalar(`
    select p.id 
      from game_user g
        inner join game_user_portal p on p.device_id = g.device_id
    where g.id = ${id}`)
  const resp = await queryExec(`update game_user_portal set email = ? where id = ?`, [email, portalId])
  const resp2 = await queryExec(`update game_user set email = ? where id = ?`, [email, id])
  console.log('resp', resp, resp2)
  return resp
}

export async function getWinners(): Promise<any> {
  const languageCode = await getSetting('languageCode', 'fr-FR')
  const url = getAssetsUrl()
  const select = `
    select jw.id, gu.device_id, '' as textureUrl,
        if(last_name != '', concat(last_name, ', ', first_name), 'No name in Profile') as user,
        if(gu.email != '', gu.email, 'No Email in Profile')          as email,
        date_format(jw.createdAt, '%d-%m-%Y')                        as date,
        'Jackpot'                                                    as origin,
        jw.state                                                     as state,
        j.prize                                                      as prize,
        gu.id                                                        as userId
    from jackpot_win jw
        inner join jackpot j on jw.jackpot_id = j.id
        inner join game_user gu on jw.game_user_id = gu.id
    where jw.createdAT
        union
    select r.id, gu.device_id, concat('${url}', texture_url) as textureUrl,
        if(last_name != '', concat(last_name, ', ', first_name), '') as user,
        if(gu.email != '', gu.email, 'n/a')                          as email,
        date_format(r.closing_date, '%d-%m-%Y')                     as date,
        'Raffle'                                                     as origin,
        r.state                                                      as state,
        if(rl.id, concat(rl.name,' | ',rl.description), 'No localization data for this raffle')          as prize,
        gu.id                                                        as userId
      from raffle_wins rw
        inner join raffle_history rh on rw.raffle_history_id = rh.id
        inner join raffle r on rh.raffle_id = r.id
        inner join game_user gu on r.winner = gu.id
        left join raffle_localization rl on r.id = rl.raffle_id and rl.language_code = '${languageCode}'
      where r.closing_date
    order by 6 desc
  `
  const data = await query(select)
  for (const row of data) 
    row.player = await getGameUserByDeviceId(row.device_id)
  
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return data
}

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
}

export async function getRaffles(email: string, onlyLive = false): Promise<RafflePrizeData[]> {
  const url = getAssetsUrl()
  const where = onlyLive ? ' CURRENT_TIMESTAMP() BETWEEN r.live_date and r.closing_date ' : ' true '
    const user = await getGameUserByDeviceEmail(email)
    const raffles = await query(`
      SELECT r.id, r.closing_date, r.raffle_number_price, concat('${url}', r.texture_url) as texture_url, r.item_highlight, 
            coalesce((select sum(coalesce(rh2.raffle_numbers, 0))
              from raffle_history rh2 where rh2.game_user_id = ${user.id} and rh2.raffle_id = r.id), 0)
              as participationsPurchased
      FROM raffle r
        left join raffle_history rh on r.id = rh.raffle_id
      where ${where}
      group by r.id
  `) as RafflePrizeData[]
  for (const raffle of raffles) {
    const { name, description } = await getRaffleLocalizationData(user, raffle.id)
    if (raffle == null) throw createHttpError(StatusCodes.BAD_REQUEST, 'no localization data for this raffle')
    if (name == null) throw createHttpError(StatusCodes.BAD_REQUEST, 'no localization data for this raffle')
    raffle.name = name
    raffle.description = description
  }
  return camelcaseKeys(raffles)
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
  try {
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
  } catch (err) {
    throw createHttpError(StatusCodes.BAD_REQUEST, 'Impossible de créer une compte avec cet email')
  }
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

export const getCards = async (userId: number):Promise <CardCollectionsDataCL> => {
  let starsForTrade = 0
  const languageId = Number((await queryScalar(`
    select l.id from language l
      inner join game_user gu on gu.language_code = l.language_code and gu.id = ${userId}
  `)))
  const assetsUrl = getAssetsUrl()
  const cardSets: CollectibleCardSetDataCL[] = camelcaseKeys(
    
      await query(`
      select cs.id, front_card_id, 
          (select text from localization where item = 'cardSet' and item_id = cs.id and language_id = ?) as title,
          cs.theme_color, cs.reward_type, cs.reward_amount
        from card_set cs
      `, [String(languageId)]
      )
  )

  for (const cardSet of cardSets) {
    //URGENT the line below is temporary, I have to assign a front card for all the card sets 
    if(!cardSet.frontCardId ){
      const frontCardId = Number(await queryScalar(`select id from card where card_set_id = ${cardSet.id} order by id desc limit 1`))
      await queryExec(`update card_set set front_card_id = ${frontCardId} where id = ${cardSet.id}`)
      cardSet.frontCardId = frontCardId
    }
    cardSet.ownedQuantity = 0
    cardSet.rewardClaimed = await getCardSetClaimed(cardSet.id, userId)
    // cardSet.atlasData = {} as Atlas
    cardSet.cards = <CollectibleCardDataCL[]> camelcaseKeys(await query(`
      select c.id, card_set_id as setId, c.texture_url, c.thumb_url, c.stars,
        (select text from localization where item = 'card' and item_id = c.id and language_id = ${languageId}) as title,
        (select count(*) from game_user_card gc where gc.game_user_id = ${userId} and gc.card_id = c.id) as ownedQuantity
      from card c where c.card_set_id = ${cardSet.id}
    `))
    for (const card of cardSet.cards) {
      cardSet.ownedQuantity += (card.ownedQuantity > 0 ? 1 : 0)
      if(card.ownedQuantity > 1) starsForTrade += ((card.ownedQuantity - 1) * card.stars)
    }
  }
  const chestRegular = await getRegularChest()
  const chestPremium = await getPremiumChest()
  const chestRegularCl = chestToChestCL(chestRegular)
  const chestPremiumCl = chestToChestCL(chestPremium)
  const tradeData: CollectibleCardsTradeDataCL = {
    starsForTrade,
    chestRegular: chestRegularCl,
    chestPremium: chestPremiumCl
  }
  const cardCollectionsDataCL: any = { 
    collectibleCardSets: cardSets,
    tradeData,
    assetsUrl
  }
   
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return cardCollectionsDataCL
}