import camelcaseKeys from "camelcase-keys"
import createHttpError from "http-errors"
import { StatusCodes } from "http-status-codes"
import { query, queryScalar } from "../../../db"
import { getRandomNumber } from "../../../helpers"
import { CardForSpin } from "../slot.types"
import { CardDropRateTable, getCardDropRateTable } from "./card.service"

export const getWiningCard = async (languageCode: string): Promise<CardForSpin> => {
  // toma las estrellas de la tabla de probabilidades en base a un numero al azar, como se hace en el spin
  // me va a devolver una cantidad de estrellas de la carta que va a ganar
  // tomo todas las cartas que tengan ese número de estrellas
  // sortéo una de ellas y la devuelvo
  const languageId = await queryScalar(`select id from language where language_code = ?`, [languageCode])

  const dropRateTableRow = await getDropRateTableRow()
  if(!dropRateTableRow) throw createHttpError(StatusCodes.BAD_REQUEST, 'Error getting winning card')

  console.log('select stars = ', dropRateTableRow.stars)

  const { cardsByByStars, stars }: { cardsByByStars: CardForSpin[]; stars: number } = await getCardWithByStars(dropRateTableRow, languageId)
  if(!cardsByByStars || cardsByByStars.length === 0) throw createHttpError(StatusCodes.BAD_REQUEST, `There are not cards with ${stars} stars`)

  const randomNumberToObtainCardRow = getRandomNumber(1, cardsByByStars.length) - 1
  const winningCard = cardsByByStars[randomNumberToObtainCardRow]
  const ownedQuantity = await getOwnedQuantityByCardId(winningCard.id)
  return  {
    id: winningCard.id,
    rewardType: winningCard.rewardType,
    rewardAmount: winningCard.rewardAmount,
    title: winningCard.title,
    stars: winningCard.stars,
    ownedQuantity: Number(ownedQuantity || 0)
  }
}

async function getOwnedQuantityByCardId(winningCardId: number) {
  return await queryScalar(`
    select count(*) from game_user_card where card_id = ?
  `, [winningCardId])
}

async function getCardWithByStars(dropRateTableRow: CardDropRateTable, languageId: string | undefined) {
  const stars = dropRateTableRow.stars
  const cardsByByStars: CardForSpin[] = camelcaseKeys(await query(`
    select c.id, cs.reward_amount, cs.reward_type, c.stars, c.thumb_url,
          (select coalesce(text, 'No localization for this card') 
            from localization l where l.item = 'card' and l.item_id = c.id and l.language_id = '${Number(languageId)}'
          ) as title
    from card c
        inner join card_set cs on c.card_set_id = cs.id
    where stars = ${stars}
  `))
  return { cardsByByStars, stars }
}

async function getDropRateTableRow() {
  const cardropRateTable = await getCardDropRateTable({ order: 'probability', orderDirection: 'desc' })
  const randomNumberToObtainRowWithStars = getRandomNumber(1, 100)
  let floor = 0
  const dropRateTableRow = cardropRateTable.find((row) => {
    const isWin = ((randomNumberToObtainRowWithStars > floor) && (randomNumberToObtainRowWithStars <= floor + Number(row.probability)))
    floor += Number(row.probability)
    return isWin
  })
  return dropRateTableRow
}
