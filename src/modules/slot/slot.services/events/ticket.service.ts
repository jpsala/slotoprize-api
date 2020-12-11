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