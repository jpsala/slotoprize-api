import { isNumber } from "class-validator"
import createHttpError from "http-errors"
import { StatusCodes } from "http-status-codes"
import { log } from "../../../../log"
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

export const getTicketPacksData = async (): Promise<TicketPackData[]> => {
  const defaultTicketPackDataJson = getDefaultTicketPacksData()
  const defaultTicketPackDataStr = JSON.stringify(defaultTicketPackDataJson)
  const ticketPacksDataStr = await getSetting('ticketPacksData', defaultTicketPackDataStr)
  try {
    const ticketPacksData = <TicketPackData[]> JSON.parse(ticketPacksDataStr)
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