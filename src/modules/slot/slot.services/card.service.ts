// #region imports and types
import camelcaseKeys from "camelcase-keys"
import createHttpError from "http-errors"
import { StatusCodes } from "http-status-codes"
import { ResultSetHeader } from "mysql2"
import getConnection, { query, queryExec, queryGetEmpty, queryOne, queryScalar } from "../../../db"
import { isValidPaymentType, saveFile } from "../../../helpers"
import { getLocalizations, Localization } from "../../meta/meta-services/localization.service"
import { Language } from "../../meta/models"
export type CardSet = {id: number, rewardType: string, themeColor: string, rewardAmount: number, cards?: Card[], localizations: Localization[]}
export type Card = { id: number, stars: number, localizations: Localization[], textureUrl: string, thumbUrl: string, cardSet }
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
  const cardSets: CardSet[] = camelcaseKeys(await query(`select * from card_set`))
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
  console.log('newCard', newCard)
  return {cards, languages, newCard}
}
export const getCardSetsForCrud = async (): Promise<{ cardSets: CardSet[], languages: Language[], newCardSet: CardSet, newCard: Card }> => {
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
  newCardSet.localizations.push(
    {
      id: -1,
      item: "cardSet",
      languageCode: language.languageCode,
      languageId: language.id,
      text: '',
      // text: `${language.languageCode} localization`,
    }
    )
    
    
  return {cardSets, languages, newCardSet, newCard}
}
export const postCardSetsForCrud = async (cardSet: CardSet): Promise<any> => {
  console.log('cardSet', cardSet )
  const isNew = cardSet.id === -1
  console.log('isnew', isNew, typeof cardSet.id)
  if(cardSet.rewardAmount === 0) throw createHttpError(StatusCodes.BAD_REQUEST, 'Reward Amount can not be empty')
  if(cardSet.themeColor === '') throw createHttpError(StatusCodes.BAD_REQUEST, 'Theme Color can not be empty')
  if(!isValidPaymentType(`${cardSet.rewardType}s`)) throw createHttpError(StatusCodes.BAD_REQUEST, 'Reward Type is invalid')
  
  const languages: Language[] = camelcaseKeys(await query(`select * from language`))
  // if(!isNew){
    if(!cardSet.localizations || cardSet.localizations.length !== languages.length) throw createHttpError(StatusCodes.BAD_REQUEST, 'Missing Card Set Localizations')
    for (const localization of cardSet.localizations) 
      if(localization.text === '') throw createHttpError(StatusCodes.BAD_REQUEST, 'Card Set localizations can not be empty')

  // }
  const cardSetExists = await queryOne(`select id from card_set where id = ${cardSet.id}`)
  let response: ResultSetHeader
  if(cardSetExists)
    response = await queryExec(`
        update card_set set 
          reward_amount = ?,
          reward_type = ?,
          theme_color = ?
        where id = ${cardSet.id}`, 
      [cardSet.rewardAmount, cardSet.rewardType, cardSet.themeColor]
    )
  else 
    response = (await queryExec(`insert into card_set(reward_amount,reward_type,theme_color) values (?, ?, ?)`,
      [cardSet.rewardAmount, cardSet.rewardType, cardSet.themeColor])
    )

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


  return cardSet
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const postCardForCrud = async (_fields: any, files): Promise<any> => {
  type Fields = {
    cardSetId: number, id: number, localizations: Localization[], stars: number, textureUrl?: string, thumbUrl?: string, cards: []
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
    console.log('fields', fields)
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

  return fields
}
export const deleteCardForCrud = async (cardId: number): Promise<void> => { 
  if(!cardId) throw createHttpError(StatusCodes.BAD_REQUEST, 'Card ID param is required')
  await queryExec(`delete from localization where item = 'card' and item_id = ${cardId}`)
  const resp = await queryExec(`delete from card where id = ${cardId}`)
  if(resp.affectedRows !== 1) throw createHttpError(StatusCodes.BAD_REQUEST, 'Problem deleting card ' + String(cardId))
  console.log('resp', resp)
}
export const deleteCardSetForCrud = async (cardSetId: number): Promise<void> => { 
  console.log('cardSetId', cardSetId)
  if(!cardSetId) throw createHttpError(StatusCodes.BAD_REQUEST, 'Card Set ID param is required')
  const cards = await query(`select id from card where card_set_id = ?`, [String(cardSetId)])
  for (const card of cards) 
    await queryExec(`delete from localization where item = 'card' and item_id = ${String(card.id)}`)
    
    let resp = await queryExec(`delete from card where card_set_id = ${cardSetId}`)
    
  await queryExec(`delete from localization where item = 'cardSet' and item_id = ${String(cardSetId)}`)
  if(!resp) throw createHttpError(StatusCodes.BAD_REQUEST, 'Problem deleting card ' + String(cardSetId))
  resp = await queryExec(`delete from card_set where id = ${cardSetId}`)
  if(resp.affectedRows !== 1) throw createHttpError(StatusCodes.BAD_REQUEST, 'Problem deleting card set ' + String(cardSetId))
  console.log('resp', resp)
}
