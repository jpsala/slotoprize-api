// #region imports and types
import { connect } from "http2"
import camelcaseKeys from "camelcase-keys"
import createHttpError from "http-errors"
import { StatusCodes } from "http-status-codes"
import { ResultSetHeader } from "mysql2"
import getConnection, { query, queryExec, queryGetEmpty, queryOne, queryScalar } from "../../../db"
import { isValidPaymentType } from "../../../helpers"
import { getLocalizations, Localization } from "../../meta/meta-services/localization.service"
import { Language } from "../../meta/models"
export type CardSet = {id: number, rewardType: string, themeColor: string, rewardAmount: number, cards?: Card[], localizations: Localization[]}
export type Card = { id: number, localizations: Localization[], textureUrl: string, cardSet }
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
  const cards: Card[] = camelcaseKeys(await query(`select * from card ${where}`))    
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
      text: `${language.languageCode} localization`,
    }
    )
  const newCardSet: CardSet = await queryGetEmpty('select * from card_set where id = -1', true)
  newCardSet.localizations = []
  for (const language of languages) 
  newCardSet.localizations.push(
    {
      id: -1,
      item: "cardSet",
      languageCode: language.languageCode,
      languageId: language.id,
      text: `${language.languageCode} localization`,
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
  if(!isNew){
    if(!cardSet.localizations || cardSet.localizations.length !== languages.length) throw createHttpError(StatusCodes.BAD_REQUEST, 'Missing Card Set Localizations')
    for (const localization of cardSet.localizations) 
      if(localization.text === '') throw createHttpError(StatusCodes.BAD_REQUEST, 'Card Set localizations can not be empty')

  }
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
export const postCardForCrud = async (card: CardSet): Promise<any> => {
  console.log('card', card )
  const isNew = card.id === -1
  console.log('isnew', isNew, typeof card.id)
  // if(card.rewardAmount === 0) throw createHttpError(StatusCodes.BAD_REQUEST, 'Reward Amount can not be empty')
  
  const languages: Language[] = camelcaseKeys(await query(`select * from language`))
  if(!isNew){
    if(!card.localizations || card.localizations.length !== languages.length) throw createHttpError(StatusCodes.BAD_REQUEST, 'Missing Card Set Localizations')
    for (const localization of card.localizations) 
      if(localization.text === '') throw createHttpError(StatusCodes.BAD_REQUEST, 'Card localizations can not be empty')

  }
  const cardSetExists = await queryOne(`select id from card_set where id = ${card.id}`)
  let response: ResultSetHeader
  if(cardSetExists)
    response = await queryExec(`
        update card set 
          reward_amount = ?,
          reward_type = ?,
          theme_color = ?
        where id = ${card.id}`, 
      [card.rewardAmount, card.rewardType, card.themeColor]
    )
  else 
    response = (await queryExec(`insert into card(reward_amount,reward_type,theme_color) values (?, ?, ?)`,
      [card.rewardAmount, card.rewardType, card.themeColor])
    )

  if(card.id === -1) card.id = response.insertId

  // save localizations
  if (card.localizations && card.localizations.length > 0){
    const conn = await getConnection()
    await conn.beginTransaction()
    try {
      await conn.query(`delete from localization where item = 'card' and item_id = ${card.id}`)
        for (const localization of card.localizations) 
          await conn.query(`insert into localization(language_id, item, item_id, text) values(?,?,?,?)`,
          [localization.languageId, 'card', card.id, localization.text])
      await conn.commit()
    } catch(error) {
      await conn.rollback()
    } finally {
        conn.destroy()
    }
  }


  return card
}