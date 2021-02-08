// #region imports and types
import { join } from "path"
import camelcaseKeys from "camelcase-keys"
import createHttpError from "http-errors"
import { StatusCodes } from "http-status-codes"
import { ResultSetHeader } from "mysql2"
import getConnection, { query, queryExec, queryGetEmpty, queryOne, queryScalar } from "../../../db"
import { saveFile , getUrlWithoutHost, getAssetsPath , getAssetsUrl, getRandomNumber, checkIfToFastEndpointCall, isValidPaymentType } from "../../../helpers"
import { getLocalizations, Localization } from "../../meta/meta-services/localization.service"
import { Language } from "../../meta/models"
import { Atlas, buildAtlas, getAtlas } from "../../meta/meta-services/atlas"
import { getGameUserById } from "../../meta/meta.repo/gameUser.repo"
import { GameUser } from "../../meta/meta.types"
import { Wallet } from "../slot.types"
import { addToWallet } from "../slot.repo/wallet.repo"
import { getSetting } from "./settings.service"
import { updateWallet } from "./wallet.service"
import { Chest, ChestChestType, chestToChestCL, getChestChestTypes, getPremiumChest, getRegularChest } from "./chest.service"

export type CardSet = {id: number, rewardType: string, rewardClaimed: boolean, themeColor: string,
            rewardAmount: number, cards?: Card[], localizations: Localization[], frontCardId: number, img?: string }
export type Card = { id: number, stars: number, localizations: Localization[], textureUrl: string, thumbUrl: string, cardSet, userCardId?: number }
// #endregion
// #region comments
/*
card set
id
title
theme color
reward type
reward amount
collectable card[]
atlas data

card
id
title
stars:number (drop rate)
textureUrl interno para generar el atlas
thumbTextureUrl interno para generar el atlas
*/
// #endregion
export const getCard = async (cardId?: number): Promise<Card | undefined> => {
  const card: Card = camelcaseKeys(await queryOne(`
    select 
      id, card_set_id, stars,
      texture_url,
      thumb_url
    from card where id = ${cardId as number}`))    
  card.localizations = camelcaseKeys(await getLocalizations('card', card.id))
  return card
}
export const getCards = async (cardSetId?: number): Promise<Card[] | undefined> => {
  const where = cardSetId ? ` where card_set_id = ${cardSetId}`: ''
  const cards: Card[] = camelcaseKeys(await query(`
    select 
      id, card_set_id, stars,
      texture_url,
      thumb_url
    from card ${where}`))    
  for (const card of cards) 
    card.localizations = camelcaseKeys(await getLocalizations('card', card.id))
  return cards
}
export const setCard = async (card: Card): Promise<void> => {
  if(!card.id) card.id = -1
  const cardDTO = camelcaseKeys(card)
  const cardInDb = await queryOne(`select id from card where id = ${card.id}`)

  let resp: ResultSetHeader
  if(cardInDb) resp = await queryExec(`update cardSet set ? where id = ${card.id}`, [cardDTO])
  else resp = await queryExec(`insert into card ?`, [cardDTO])
  if (!cardInDb) card.id = resp.insertId

  const languagesCount = Number(await queryScalar(`select (count) from language`))
  if(languagesCount > 0 && (!card.localizations || (card.localizations.length < languagesCount)))
    throw createHttpError(StatusCodes.BAD_REQUEST, 'There are missing localizations')

  await queryExec(`delete from localization where item = 'card' and item_id = ${card.id}`)
  if (card.localizations && card.localizations.length > 0)
    for (const localization of card.localizations) 
      await queryExec(`insert into localization(language_id, item, item_id, text) values(?,?,?,?)`,
      [localization.languageId, 'card', localization.item_id, localization.text])
}
export const getCardSets = async (): Promise<CardSet[] | undefined> => {
  const cardSets: CardSet[] = camelcaseKeys(await query(`
    select cs.id, cs.theme_color, cs.reward_type, cs.reward_amount, cs.front_card_id, c.thumb_url as img
    from card_set cs
        left join card c on c.id = cs.front_card_id
  `))
  for (const cardSet of cardSets) {
    cardSet.localizations = camelcaseKeys(await getLocalizations('cardSet', cardSet.id))
    cardSet.cards = (await getCards(cardSet.id))
  }
  return cardSets
}
export const getCardsForCrud = async (): Promise<{ cards: Card[], languages: Language[], newCard: Card }> => {
  const cards: Card[] = (await getCards()) || []
  const languages: Language[] = camelcaseKeys(await query(`select * from language`))
  // const newCard: Card = { id: -1, localizations: [], textureUrl: '', cardSet: undefined }
  const newCard: Card = await queryGetEmpty('select * from card where id = -1')
  return {cards, languages, newCard}
}
export const getCardSetsForCrud = async ():
  Promise<{ cardSets: CardSet[], languages: Language[], newCardSet: CardSet, newCard: Card, chestRegular: Chest, chestPremium: Chest, chestTypes: ChestChestType[] }> => 
{
  const cardSets: CardSet[] = (await getCardSets()) || []

  const languages: Language[] = camelcaseKeys(await query(`select * from language`))

  const newCard: Card = await queryGetEmpty('select * from card where id = -1', true)
  newCard.localizations = []
  for (const language of languages) 
    newCard.localizations.push(
      {
        id: -1,
        item: "card",
        languageCode: language.languageCode,
        languageId: language.id,
        text: '',
        // text: `${language.languageCode} localization`,
      }
  )
  newCard.textureUrl = 'https://assets.slotoprizes.tagadagames.com/img/missing.png'
  newCard.thumbUrl = 'https://assets.slotoprizes.tagadagames.com/img/missing.png'
  
  const newCardSet: CardSet = await queryGetEmpty('select * from card_set where id = -1', true)
  newCardSet.localizations = []
  newCardSet.cards = []
  for (const language of languages) 
    newCardSet.localizations.push({
        id: -1,
        item: "cardSet",
        languageCode: language.languageCode,
        languageId: language.id,
        text: '',
        // text: `${language.languageCode} localization`,
    })

  const chestRegular = await getRegularChest()    
  const chestPremium = await getPremiumChest()    
  const chestTypes = await getChestChestTypes()
  return {cardSets, languages, newCardSet, newCard, chestRegular, chestPremium, chestTypes}
}
export const postCardSetForCrud =   async (cardSet: CardSet): Promise<any> => {
  if(cardSet.rewardAmount === 0) throw createHttpError(StatusCodes.BAD_REQUEST, 'Reward Amount can not be empty')
  if(cardSet.themeColor === '') throw createHttpError(StatusCodes.BAD_REQUEST, 'Theme Color can not be empty')
  if(!isValidPaymentType(`${cardSet.rewardType}`)) throw createHttpError(StatusCodes.BAD_REQUEST, 'Reward Type is invalid')
  
  const languages: Language[] = camelcaseKeys(await query(`select * from language`))
  // if(!isNew){
    if(!cardSet.localizations || cardSet.localizations.length !== languages.length) throw createHttpError(StatusCodes.BAD_REQUEST, 'Missing Card Set Localizations')
    for (const localization of cardSet.localizations) 
      if(localization.text === '') throw createHttpError(StatusCodes.BAD_REQUEST, 'Card Set localizations can not be empty')

  // }
  const cardSetExists = await queryOne(`select id from card_set where id = ${cardSet.id}`)
  let response: ResultSetHeader
  if(cardSetExists){
    response = await queryExec(`
        update card_set set 
          reward_amount = ?,
          reward_type = ?,
          theme_color = ?,
          front_card_id = ?
        where id = ${cardSet.id}`, 
      [cardSet.rewardAmount, cardSet.rewardType, cardSet.themeColor, cardSet.frontCardId])
      const frontCard = await getCard(cardSet.frontCardId)
      console.log('frontCard', frontCard)
      cardSet.img = frontCard?.thumbUrl
  } else 
    {response = (await queryExec(`insert into card_set(reward_amount,reward_type,theme_color) values (?, ?, ?)`,
      [cardSet.rewardAmount, cardSet.rewardType, cardSet.themeColor])
    )}

  if(cardSet.id === -1) cardSet.id = response.insertId

  // save localizations
  if (cardSet.localizations && cardSet.localizations.length > 0){
    const conn = await getConnection()
    await conn.beginTransaction()
    try {
      await conn.query(`delete from localization where item = 'cardSet' and item_id = ${cardSet.id}`)
        for (const localization of cardSet.localizations) 
          await conn.query(`insert into localization(language_id, item, item_id, text) values(?,?,?,?)`,
          [localization.languageId, 'cardSet', cardSet.id, localization.text])
      await conn.commit()
    } catch(error) {
      await conn.rollback()
    } finally {
        conn.destroy()
    }
  }

  await buildCardSetAtlasThumbs()
  return cardSet
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const postCardForCrud = async (_fields: any, files): Promise<any> => {
  type Fields = {
    cardSetId: number, id: number, localizations: Localization[], stars: number,
    textureUrl?: string, thumbUrl?: string, cards: [], frontCardId: number
  }
  type UploadedFile = { path: string; name: string; }
  let fields: Fields
  try {
    fields = JSON.parse(_fields.json) as Fields
  } catch (error) {
    throw createHttpError(StatusCodes.BAD_REQUEST, 'Error parsing fields in Card Post')
  }
  
  const textureFile: UploadedFile = files.textureFile
  const thumbFile: UploadedFile = files.thumbFile

  const isNew = fields.id === -1
  if(isNew) {
    fields.textureUrl = undefined
    fields.thumbUrl = undefined
    // fields.cards = []
  }

  if ((!textureFile && !fields.textureUrl)) throw createHttpError(StatusCodes.BAD_REQUEST, 'Select a card image')
  if ((!thumbFile && !fields.thumbUrl)) throw createHttpError(StatusCodes.BAD_REQUEST, 'Select an image for the thumb')
  if(!fields.stars || fields.stars > 5) throw createHttpError(StatusCodes.BAD_REQUEST, 'Stars has to be less or equal to 5')

  
    const languages: Language[] = camelcaseKeys(await query(`select * from language`))
    if(!fields.localizations || fields.localizations.length !== languages.length) throw createHttpError(StatusCodes.BAD_REQUEST, 'Missing Card Set Localizations')
    for (const localization of fields.localizations) 
      if(localization.text === '') throw createHttpError(StatusCodes.BAD_REQUEST, 'Card localizations can not be empty')

  let response: ResultSetHeader
  const cardExists = await queryOne(`select id from card where id = ${fields.id}`)
  if(cardExists)
    {response = await queryExec(` update card set stars = ? where id = ${fields.id}`, [fields.stars] )}
  else {
    delete (fields as any).id
    response = (await queryExec(`insert into card(stars, card_set_id) values (?, ?)`, [fields.stars, fields.cardSetId]) )
    fields.id = response.insertId
  }
  // save localizations
  if (fields.localizations && fields.localizations.length > 0){
    const conn = await getConnection()
    await conn.beginTransaction()
    try {
      await conn.query(`delete from localization where item = 'card' and item_id = ${fields.id}`)
      for (const localization of fields.localizations) 
      await conn.query(`insert into localization(language_id, item, item_id, text) values(?,?,?,?)`,
      [localization.languageId, 'card', fields.id, localization.text])
      await conn.commit()
    } catch(error) {
      await conn.rollback()
    } finally {
      conn.destroy()
    }
  }
  
  // Save files if they exists
  if (textureFile) {    
    fields.textureUrl = saveFile({ file: textureFile, path: 'cards', id: String(fields.id), delete: true }).fullUrl
    await query(`update card set texture_url = ? where id = ?`, [ fields.textureUrl, String(fields.id) ])
  }
  if (thumbFile) {
    fields.thumbUrl = saveFile({ file: thumbFile, path: 'cards', id: `thumb_${String(fields.id)}`, delete: true }).fullUrl
    await query(`update card set thumb_url = ? where id = ?`, [ fields.thumbUrl, String(fields.id) ])
  }
  await buildCardSetAtlas(fields.cardSetId)
  await buildCardSetAtlasThumbs()
  
  return fields
}
export const deleteCardForCrud = async (cardId: number): Promise<void> => { 
  if(!cardId) throw createHttpError(StatusCodes.BAD_REQUEST, 'Card ID param is required')
  const cardSetId = Number(await queryScalar(`select card_set_id from card where id = ${cardId}`))
  await buildCardSetAtlas(cardSetId)
  await queryExec(`delete from localization where item = 'card' and item_id = ${cardId}`)
  const resp = await queryExec(`delete from card where id = ${cardId}`)
  if(resp.affectedRows !== 1) throw createHttpError(StatusCodes.BAD_REQUEST, 'Problem deleting card ' + String(cardId))
}
export const deleteCardSetForCrud = async (cardSetId: number): Promise<void> => {
  if(!cardSetId) throw createHttpError(StatusCodes.BAD_REQUEST, 'Card Set ID param is required')
  const cards = await query(`select id from card where card_set_id = ?`, [String(cardSetId)])
  for (const card of cards) 
  await queryExec(`delete from localization where item = 'card' and item_id = ${String(card.id)}`)
  
  let resp = await queryExec(`delete from card where card_set_id = ${cardSetId}`)
  
  await queryExec(`delete from localization where item = 'cardSet' and item_id = ${String(cardSetId)}`)
  if(!resp) throw createHttpError(StatusCodes.BAD_REQUEST, 'Problem deleting card ' + String(cardSetId))
  resp = await queryExec(`delete from card_set where id = ${cardSetId}`)
  
  if(resp.affectedRows !== 1) throw createHttpError(StatusCodes.BAD_REQUEST, 'Problem deleting card set ' + String(cardSetId))
  // await deleteAtlas(`card_set_${cardSetId}`)
  // await getAtlasForCollectibleCardSets(true) // para regenerar el atlas de los thumbs
  await buildCardSetAtlasThumbs()
}
export type CardDropRateTable = {id: number, stars: number, probability: number}
export const postCardDropRateTable = async (table: CardDropRateTable[]): Promise<void> => {
  if(!table) throw createHttpError(StatusCodes.BAD_REQUEST, 'Table can not be empty')
  await queryExec(`delete from card_drop_rate`)
  for (const row of table) 
    await queryExec(`insert into card_drop_rate set ?`, row)
  
}
export const getCardDropRateTable = async (
    {order = 'stars', orderDirection = 'asc'}: {order?: 'stars'|'probability', orderDirection?: 'asc'|'desc'} = {}
    ): Promise<CardDropRateTable[]> => {
  const orderBy = ` ${order} ${orderDirection} `
  let table =  (await query(`select * from card_drop_rate order by ${orderBy}`)) as CardDropRateTable[]
  
  if(!table || table.length === 0)
    table = [
      {id: 0, stars: 5, probability: 2},
      {id: 1, stars: 4, probability: 8},
      {id: 2, stars: 3, probability: 10},
      {id: 3, stars: 2, probability: 30},
      {id: 4, stars: 1, probability: 50},
    ]
  return table
}

//  For client
// #region Types
export type CardCollectionsDataCL = {
    collectibleCardSets: CollectibleCardSetDataCL[];
    atlasData: Atlas; // compuesto por los thumbnails de la imagen que va a ser front de cada set, como name paso el string(id)
    tradeData: CollectibleCardsTradeDataCL;
  }
  export type CollectibleCardSetDataCL = {
    id: number;
    title: string;
    themeColor: string;
    cards: CollectibleCardDataCL[];
    rewardType: string;
    rewardAmount: number;
    ownedQuantity: number;
    rewardClaimed: boolean;
    frontCardId: number;
    atlasData: Atlas; // todas los thumbnails de ese album, como name paso el string(id)
}
export type CollectibleCardDataCL = {
    id: number;
    setId: number;
    title: string;
    stars: number;
    textureUrl: string;
    ownedQuantity: number;
}
export type  RewardChest = {
  amount: number;
  currency: string;
  rewards: RewardDataCL[]
}
export type CollectibleCardsTradeDataCL = {
  starsForTrade: number;
  chestRegular: RewardChest;
  chestPremium: RewardChest;
}
export type RewardDataCL = {
  amount: number;
  type: string;
}
// #endregion

export const getCardsCL = async (userId: number):Promise <CardCollectionsDataCL> => {
  let starsForTrade = 0
  const languageId = Number((await queryScalar(`
    select l.id from language l
      inner join game_user gu on gu.language_code = l.language_code and gu.id = ${userId}
  `)))
  const collectibleCardSetDataAtlas = await getAtlasForCollectibleCardSets()
  collectibleCardSetDataAtlas.textureUrl = getAssetsUrl() + collectibleCardSetDataAtlas.textureUrl
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
    cardSet.atlasData = await getCardSetAtlas(cardSet)
    cardSet.atlasData.textureUrl =  getAssetsUrl() + cardSet.atlasData.textureUrl
    // cardSet.atlasData = {} as Atlas
    cardSet.cards = <CollectibleCardDataCL[]> camelcaseKeys(await query(`
      select c.id, card_set_id as setId, c.texture_url, c.stars,
        (select text from localization where item = 'card' and item_id = c.id and language_id = ${languageId}) as title,
        (select count(*) from game_user_card gc where gc.game_user_id = ${userId} and gc.card_id = c.id) as ownedQuantity
      from card c where c.card_set_id = ${cardSet.id}
    `))
    for (const card of cardSet.cards) {
      cardSet.ownedQuantity += (card.ownedQuantity > 0 ? 1 : 0)
      if(card.ownedQuantity > 1) starsForTrade += ((card.ownedQuantity - 1) * card.stars)
      if(!card.ownedQuantity) card.textureUrl = ''
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
  const cardCollectionsDataCL: CardCollectionsDataCL = { 
    collectibleCardSets: cardSets,
    atlasData: collectibleCardSetDataAtlas,
    tradeData
  }
   
  return cardCollectionsDataCL
}
const getCardSetAtlas = async (cardSet: CollectibleCardSetDataCL): Promise<Atlas> => {
  const thumbs: { id: string; image: string} [] = await getCardSetImagesForAtlas(cardSet.id)
  const atlas = await getAtlas(`card_set_${cardSet.id}`, thumbs)
  return atlas
}
export const buildCardSetAtlas = async (cardSetId: number): Promise<Atlas> => {
  console.log('build', cardSetId)
  const thumbs: { id: string; image: string} [] = await getCardSetImagesForAtlas(cardSetId)
  const atlas = await buildAtlas(thumbs,`card_set_${cardSetId}`)
  // await saveAtlasToDB(atlas)
  return atlas
}
export const buildCardSetAtlasThumbs = async (): Promise<Atlas> => {
  console.log('buildCardSetAtlasThumbs', )
  const thumbs: { id: string; image: string} [] = await getThumbsImagesForAtlas()
  const atlas = await buildAtlas(thumbs, 'card_sets') 
  return atlas
}
export const getAtlasForCollectibleCardSets = async (rebuild = false): Promise<Atlas> => {
  const thumbs: { id: string; image: string} [] = await getThumbsImagesForAtlas()
  const atlas = await getAtlas('card_sets', thumbs, rebuild) 

  return atlas
}

async function getThumbsImagesForAtlas() {
  const basePath = getAssetsPath()
  const cardSets: CardSet[] = camelcaseKeys(await query(`
    select id, theme_color, reward_type, reward_amount, front_card_id from card_set
  `))
  const thumbs: { id: string; image: string} [] = []

  for (const cardSet of cardSets) {
    const cardForThumb = (await queryOne(`
      select id, thumb_url as thumbUrl from card c where id = ${cardSet.frontCardId}
    `))
    // thumbs.push(join(basePath, getUrlWithoutHost(cardForThumb)))
    if (cardForThumb) thumbs.push({ id: cardForThumb.id, image: join(basePath, getUrlWithoutHost(cardForThumb.thumbUrl)) })

  }
  return thumbs
}
async function getCardSetImagesForAtlas(cardSetId: number) {
  const basePath = getAssetsPath()

  const cardsForThumb = await query(`
    select c.id, c.thumb_url as thumbUrl
    from card c where c.card_set_id = ${cardSetId}
  `)
  const thumbs: { id: string; image: string} [] = []
  // const thumbRows = (await query(`select thumb_texture as thumbTexture from card where card_set_id = ${cardSet.id}`))
  for (const cardRow of cardsForThumb)
    thumbs.push({ id: cardRow.id, image: join(basePath, getUrlWithoutHost(cardRow.thumbUrl)) })
  return thumbs
}

export async function cardSetClaim(setId: number, userId: number): Promise<void> {

  if(!setId) throw createHttpError(StatusCodes.BAD_REQUEST, 'Missing setId')

  await ThrowIfCardSetDoesNotExists()

  await ThrowIfCardSetNotCompleted()

  await ThrowIfAlreadyClaimed()

  await storeClaimInDB()

  await rewardUser()

  async function rewardUser() {
    const {rewardType, rewardAmount}: {rewardType: string, rewardAmount: number} = camelcaseKeys(await queryOne(
      `select reward_type, reward_amount from card_set where id = ${setId}`
    ))
    const user = await getGameUserById(userId) as GameUser
    const wallet = user.wallet as Wallet

    addToWallet(wallet, `${rewardType}s`, rewardAmount)

    await updateWallet(user, wallet)
  }

  async function storeClaimInDB() {
    await queryExec(`insert into card_set_claim (game_user_id, card_set_id) value(?,?)`, [userId, setId])
  }

  async function ThrowIfAlreadyClaimed() {
    const claimed = await getCardSetClaimed(setId, userId)

    if (claimed)
      throw createHttpError(StatusCodes.BAD_REQUEST, 'Reward for this set already claimed')
  }

  async function ThrowIfCardSetNotCompleted() {
    const cardSetCompleted = await getCardSetCompleted(setId, userId)

    if (!cardSetCompleted)
      throw createHttpError(StatusCodes.BAD_REQUEST, 'The Set is not completed')
  }

  async function ThrowIfCardSetDoesNotExists() {
    const cardSetExists = Number(await queryScalar(`
      select count(*) as cardSetCount from card_set where id = ${setId}
    `)) > 0

    if (!cardSetExists)
      throw createHttpError(StatusCodes.BAD_REQUEST, 'Card Set does not exists')
  }
}

export const getCardSetCompleted = async (cardSetId: number, userId: number): Promise<boolean> => {
  // const cardSet = camelcaseKeys(await queryOne(`
  //   select id, theme_color, reward_type, reward_amount, front_card_id from card_set where id = ${cardSetId}
  // `)) as CardSet
  const cards: Card[] = (await query(`
  select id, card_set_id, texture_url, stars, thumb_url from card where card_set_id = ${cardSetId}
  `))
  let completed = true
  for (const card of cards) {
    const owned = await getCardOwned(userId, card.id)
    if(!owned){
      completed = false
      break
    }
  }
  return completed
}

/*
 Endpoint: card_trade
*/
export async function getCardTrade(regularStr: string | undefined, userId: number):Promise<any>{

  if(regularStr === undefined || regularStr === '') throw createHttpError(StatusCodes.BAD_REQUEST, 'regular parameter is undefined')
  await checkIfToFastEndpointCall({endPoint: 'card_trade', userId, milliseconds: 5000})

  const isRegular = regularStr.toLocaleLowerCase() === 'true'
  const chest =  isRegular ? (await getRegularChest()) : (await getPremiumChest())

  console.log('chest:', chest)

  const user = await getGameUserById(userId) as GameUser

  const repeatedCards = await getUserRepeatedCards(user.id)
  console.log('Repeated Cards', Object.assign({}, repeatedCards))
  const userStarsAvailForTrade = getUserStarsAvailForTrade(repeatedCards)
  console.log('starsAvailForTrade %o, Price in stars %o', userStarsAvailForTrade, chest.amount)

  if(chest.amount > userStarsAvailForTrade) throw createHttpError(402, await getMessageCodeForInsuficientFunds(user.languageCode))

  const repeatedUserCardsTable: Card[] = await getRepeatedUserCardsTable()
  console.log('Repeated Cards Table', repeatedUserCardsTable)

  // remove the original, not repeated card, from each row in repeatedUserCardsTable
  // repeatedUserCardsTable wil be used to select the cards for the trade
  // and only repeated cards has to be there, not the original
  leaveOnlyRepeatedCardsInRepeatedUserCardsTable()

  await payTheUserForTheTrade()

  let remainingStars = chest.amount
  while(remainingStars > 0) {
    const card = getRandomCardFromRepeatedCards()
    console.log('removed card',  card)
    remainingStars -= card.stars
    await removeCardFromPlayer(card.userCardId as number)
    removeCardFromRepeatedCards(card)
  }
  
  
  if(remainingStars < 0) {
    
    const repeatedCardsUpdated2 = await getUserRepeatedCards(userId)
    const starsAvailUpdated2 = getUserStarsAvailForTrade(repeatedCardsUpdated2)
    console.log('updated stars Available %o, repeatedCards %o', starsAvailUpdated2, Object.assign({}, repeatedCardsUpdated2))

    const missingStars = Math.abs(remainingStars)
    console.log('stars for returning to the user', missingStars)
    await grantPlayerCardByStars(missingStars, userId)
  }
  const repeatedCardsUpdated = await getUserRepeatedCards(userId)
  const starsAvailUpdated = getUserStarsAvailForTrade(repeatedCardsUpdated)
  console.log('updated starsAvailable %o, repeatedCards %o',starsAvailUpdated, Object.assign({}, repeatedCardsUpdated))
  if(userStarsAvailForTrade !== starsAvailUpdated + chest.amount) console.warn('BAD!!!!, (userStarsAvailForTrade !== starsAvailUpdated + chest.amount')
  else console.log('OK!!! userStarsAvailForTrade === starsAvailUpdated + chest.amount')
  const collectibleCardSets = await getCardsCL(userId)
  return {
    collectibleCardSets: collectibleCardSets.collectibleCardSets,
    tradeData: { starsForTrade: starsAvailUpdated }
  }

  function removeCardFromRepeatedCards(card: Card) {
    const idx = repeatedUserCardsTable.findIndex(_row => _row.userCardId === card.userCardId)
    repeatedUserCardsTable.splice(idx, 1)
  }

  function leaveOnlyRepeatedCardsInRepeatedUserCardsTable() {
    for (const repeatedCard of repeatedCards) {
      const index = repeatedUserCardsTable.findIndex(_card => _card.id === repeatedCard.id)
      if (index === -1)
        throw createHttpError(StatusCodes.BAD_REQUEST, 'getCardTrade carta no encontrada')
      repeatedUserCardsTable.splice(index, 1)
    }
  }

  function getRandomCardFromRepeatedCards() {
    const randomNumber = getRandomNumber(0, repeatedUserCardsTable.length - 1)
    return repeatedUserCardsTable[randomNumber]
  }

  async function payTheUserForTheTrade() {
    const wallet = user.wallet as Wallet
    // console.log('wallet before', Object.assign({}, wallet))
    for (const reward of chest.rewards)
      // console.log('updating wallet', reward.type, wallet[`${reward.type}s`] , ' + ', Number(reward.amount))
      wallet[`${reward.type}s`] += Number(reward.amount)
    
    await updateWallet(user, wallet)
    // const walletUpdated = await getWallet(user)
    // console.log('wallet after', walletUpdated)
  }

  function getUserStarsAvailForTrade(repeatedCards: {id: number; stars: number; repeated: number }[]) {
    return repeatedCards.reduce((prev, card) => { return prev + (Number(card.stars) * Number((card as any).repeatedCards)) }, 0)
  }

  async function getRepeatedUserCardsTable(): Promise<Card[]> {
    return camelcaseKeys(await query(`
      select guc.id as user_card_id, c.id, c.stars
      from card c
          inner join game_user_card guc on guc.card_id = c.id
      where guc.game_user_id = ${userId} and (select count(*)
          from game_user_card guc2 inner join card c2 on guc2.card_id = c2.id
          where guc2.game_user_id = guc.game_user_id and guc2.card_id = guc.card_id)-1 > 0
  `)) as Card[]
  }
}
async function getMessageCodeForInsuficientFunds(languageCode: string) {
  if (languageCode === 'fr-FR')
    return await getSetting('insufficient-founds-for-card-trade-fr', 'Frances')
  else if (languageCode === 'en-US')
    return await getSetting('insufficient-founds-for-card-trade-en', 'Ingles')
  else
    return `LanguageCode ${languageCode} not found`
}

// async function getChestFromSettings(regular: boolean) {
    
  //   const chestStr = regular ? 'chestRegularRewards' : 'chestPremiumRewards'
  //   const defaultReward: RewardChest = { amount: 1, currency: 'spin', rewards: [{ amount: 1, type: 'spin' }] }
  //   const chestObjAsString = await getSetting(chestStr, JSON.stringify(defaultReward))

  //   const chest: RewardChest = JSON.parse(chestObjAsString) as RewardChest
  //   chest.amount = Number(chest.amount)
  //   return chest
// }

async function grantPlayerCardByStars(missingStars: number, userId: number): Promise<void>{
  const ownedCardByStars = camelcaseKeys(await queryOne(`
    select c.id from game_user_card guc inner join card c on guc.card_id = c.id
    where guc.game_user_id = ${userId} and c.stars = ${missingStars} limit 1
  `)) as Card

  if(ownedCardByStars){
    console.log('repeating a user card with stars needed', ownedCardByStars)
    await queryExec(
      `insert into game_user_card(game_user_id, card_id) values (?, ?)`,
      [userId, ownedCardByStars.id]
    )
  } else {
    const card = camelcaseKeys(await queryOne(`
      select * from card where stars = ${missingStars} limit 1
    `)) as Card
    console.log('User doesn\'t have a card with stars needed')
    console.log('Assigning card twice', card)
    await queryExec(`insert into game_user_card(game_user_id, card_id) values (?, ?)`, [userId, card.id])
    await queryExec(`insert into game_user_card(game_user_id, card_id) values (?, ?)`, [userId, card.id])
  }
}

async function removeCardFromPlayer(userCardId: number): Promise<void>{
  await queryExec(`delete from game_user_card where id = ${userCardId}`)
}

async function getUserRepeatedCards(userId: number):Promise<{id:number, stars: number, repeated:number}[]>{
  return camelcaseKeys(await query(`
      select c.id, c.stars,
      (select count(*)
      from game_user_card guc2 inner join card c2 on guc2.card_id = c2.id
      where guc2.game_user_id = guc.game_user_id and guc2.card_id = guc.card_id)-1 as repeatedCards
    from card c
      inner join game_user_card guc on guc.card_id = c.id
    where guc.game_user_id = ${userId} and
        (select count(*)
      from game_user_card guc2 inner join card c2 on guc2.card_id = c2.id
      where guc2.game_user_id = guc.game_user_id and guc2.card_id = guc.card_id) > 1
    group by c.id
  `)) as {id:number, stars: number, repeated:number}[]
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function getCardSetClaimed(setId: number, userId: number) {
  return Number(await queryScalar(`
  select count(*) from card_set_claim where card_set_id = ${setId} and game_user_id = ${userId}
  `)) > 0
}
async function getCardOwned(userId: number, cardId: number) {
  const ownedCart = Number(await queryScalar(`
  select count(*) as cardsOwned from game_user_card guc
  where guc.game_user_id = ${userId} and guc.card_id = ${cardId} 
  `))
  return ownedCart > 0
}
