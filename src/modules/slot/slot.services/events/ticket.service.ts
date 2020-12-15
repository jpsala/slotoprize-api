import { isNumber } from "class-validator"
import createHttpError from "http-errors"
import { StatusCodes } from "http-status-codes"
import { log } from "../../../../log"
import { GameUser } from "../../../meta/meta.types"
import { updateWallet } from "../../slot.repo/wallet.repo"
import { Wallet } from "../../slot.types"
import { getSetting } from "../settings.service"
/*
    public class TicketPackData
    {
        public string id;
        public int tickets;   // Amount of tickets that will be purchased with this pack.
        public float discount; // 0 to 1 value with the discount to be applied.
    }

*/
export type TicketPackData = {
  id: number,
  tickets: number,
  discount: number
}
const getDefaultTicketPacksData = (): TicketPackData[] => {
  return [
    {id: 0, tickets: 0, discount: 0},
    {id: 1, tickets: 0, discount: 0},
    {id: 2, tickets: 0, discount: 0},
    {id: 3, tickets: 0, discount: 0}
  ]
}

export const getTicketPacks = async (): Promise<TicketPackData[]> => {
  const defaultTicketPackDataJson = getDefaultTicketPacksData()
  const defaultTicketPackDataStr = JSON.stringify(defaultTicketPackDataJson)
  const ticketPacksDataStr = await getSetting('ticketPacksData', defaultTicketPackDataStr)
  try {
    const ticketPacksData = <TicketPackData[]> JSON.parse(ticketPacksDataStr)
    for (const ticketPack of ticketPacksData) {
      ticketPack.discount = Number(ticketPack.discount)
      ticketPack.tickets = Number(ticketPack.tickets)
    }
    return ticketPacksData
  } catch (error) {
    log.error(error)
    throw createHttpError(StatusCodes.BAD_REQUEST, 'Error parsing ticketPacksData from settings')
  }
}

export const validateTicketPacksData = (ticketPacksData: TicketPackData[]): void => {
  if(ticketPacksData.length < 4) throw createHttpError(StatusCodes.BAD_REQUEST, 'There has to be 4 items in TicketPacksData')
  for (const ticketPackData of ticketPacksData){
    if(!isNumber(Number(ticketPackData.discount)) || isNaN(Number(ticketPackData.discount)) || Number(ticketPackData.discount) > 1){
      ticketPackData.discount = Number(ticketPackData.discount)
      throw createHttpError(StatusCodes.BAD_REQUEST, 'Discount has to be a floating point number between 0 and 1')
    }
    if(!isNumber(Number(ticketPackData.tickets)) || isNaN(Number(ticketPackData.tickets)) || Number(ticketPackData.tickets) < 1){
      ticketPackData.tickets = Number(ticketPackData.tickets)
      throw createHttpError(StatusCodes.BAD_REQUEST, 'Tickets has to be a number greater than 1')
    }
  }
  
}

/*
 Endpoint: purchase_ticket_pack
*/
export const getPurchaseTicketPack = async (packId: number, user: GameUser): Promise<Wallet> => {

  const wallet = user.wallet as Wallet
  const userCoins = wallet.coins

  const { ticketsForUser, neededCoins } = await getPurchaseData(packId, wallet.coins)

  if(neededCoins > userCoins) throw createHttpError(StatusCodes.BAD_REQUEST, 'Insufficient funds')

  wallet.coins -= neededCoins
  wallet.tickets += ticketsForUser

  const updatedWallet = await updateWallet(user, wallet)

  return updatedWallet

}


async function getPurchaseData(packId: number, userCoins: number) {

  const ticketPrice = await getTicketPrice()
  const ticketPacks = await getTicketPacks()

  let ticketsForUser = 0
  let neededCoins = 0
  const useAllCoins = packId === -1

  if(useAllCoins) {

    ticketsForUser = getTicketsForAllUserCoins()
    neededCoins = userCoins - ( userCoins % ticketPrice)

  } else {

    const pack = getTicketPackById(ticketPacks, packId)

    neededCoins = priceInCoins(pack)
    ticketsForUser = pack.tickets

  }
  return { ticketsForUser, neededCoins }

  function getTicketsForAllUserCoins(): number {

    let discount = 0

    for (const pack of ticketPacks)
      if (userCoins > priceInCoins(pack) && pack.discount > discount)
        discount = pack.discount

    const purchasingPower = userCoins + userCoins * discount

    ticketsForUser = Math.floor(purchasingPower / ticketPrice)

    return ticketsForUser

  }

  function priceInCoins(pack: TicketPackData): number {
    const packPrice = pack.tickets * ticketPrice
    const packPriceWithDiscount = Math.floor(packPrice * (1 - pack.discount))

    return packPriceWithDiscount
  }
}

function getTicketPackById(ticketPacks: TicketPackData[], packId: number) {
  const pack = ticketPacks.find(_pack => _pack.id === packId)
  if(!pack) throw createHttpError(StatusCodes.BAD_REQUEST, 'Pack ID not found')
  return pack
}

async function getTicketPrice() {
  return Number(await getSetting('ticketPrice', '1'))
}
