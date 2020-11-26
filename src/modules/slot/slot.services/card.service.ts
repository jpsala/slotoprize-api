// #region imports and types
import camelcaseKeys from "camelcase-keys"
import { ResultSetHeader } from "mysql2"
import snakecaseKeys from "snakecase-keys"
import { query, queryExec, queryOne, queryScalar } from "../../../db"
import { getLocalizations, Localization } from "../../meta/meta-services/localization.service"
import { Language } from "../../meta/models"
export type CardAlbum = {id: number, textureUrl: string, cards?: Card[], localizations: Localization[]}
export type Card = { id: number, localizations: Localization[], textureUrl: string, cardAlbum }
// #endregion

export const getCardsForCrud = async (): Promise<{ cards: Card[], languages: Language[], newCard: Card }> => {
  const cards: Card[] = (await getCards()) || []
  const languages: Language[] = camelcaseKeys(await query(`select * from language`))
  const newCard: Card = { id: -1, localizations: [], textureUrl: '', cardAlbum: undefined }
  return {cards, languages, newCard}
}
export const getCardAlbumsForCrud = async (): Promise<{ cardAlbums: CardAlbum[], languages: Language[], newCardAlbum: CardAlbum, newCard: Card }> => {
  const cardAlbums: CardAlbum[] = (await getCardAlbums()) || []
  const languages: Language[] = camelcaseKeys(await query(`select * from language`))
  const newCard: Card = { id: -1, localizations: [], textureUrl: '', cardAlbum: undefined }
  const newCardAlbum: CardAlbum = { id: -1, textureUrl: '', cards: [], localizations: [] }
  return {cardAlbums, languages, newCardAlbum, newCard}
}
export const getCards = async (cardAlbumId?: number): Promise<Card[] | undefined> => {
  const where = cardAlbumId ? ` where card_album_id = ${cardAlbumId}`: ''
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
  if(cardInDb) resp = await queryExec(`update cardAlbum set ? where id = ${card.id}`, [cardDTO])
  else resp = await queryExec(`insert into card ?`, [cardDTO])
  if (!cardInDb) card.id = resp.insertId

  const languagesCount = await queryScalar(`select (count) from language`)
  if(languagesCount > 0 && (!card.localizations || card.localizations.length < languagesCount))
    throw createHttpError(BAD_REQUEST, 'There are missing localizations')

  await queryExec(`delete from localization where item = 'card' and item_id = ${card.id}`)
  if (card.localizations && card.localizations.length > 0)
    for (const localization of card.localizations) 
      await queryExec(`insert into localization(language_id, item, item_id, text) values(?,?,?,?)`,
      [localization.languageId, 'card', localization.item_id, localization.text])
    
}
export const getCardAlbums = async (): Promise<CardAlbum[] | undefined> => {
  const cardAlbums: CardAlbum[] = camelcaseKeys(await query(`select * from card_album`))
  for (const cardAlbum of cardAlbums) {
    cardAlbum.localizations = camelcaseKeys(await getLocalizations('cardAlbum', cardAlbum.id))
    cardAlbum.cards = (await getCards(cardAlbum.id))
  }
  
  return cardAlbums
}
export const setCardAlbum = async (cardAlbum: CardAlbum): Promise<void> => {
  if(!cardAlbum.id) cardAlbum.id = -1
  const exists = await queryOne(`select id from card_album where id = ${cardAlbum.id}`)
  const cardAlbumDTO = snakecaseKeys(cardAlbum)
  if(exists) await queryExec(`update cardAlbum set ? where id = ${cardAlbum.id}`, [cardAlbumDTO])
  else await queryExec(`insert into cardAlbum ?`, [cardAlbumDTO])
}