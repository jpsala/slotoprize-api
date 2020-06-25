import createError from 'http-errors'
import * as httpStatusCodes from "http-status-codes"
import getSlotConnection from '../db.slot'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default async function spin(deviceId: string, bet: string, wallet: any): Promise<any> {
  if (!deviceId) { throw createError(httpStatusCodes.BAD_REQUEST, 'deviceId is a required parameter') }
  if (!bet) { throw createError(httpStatusCodes.BAD_REQUEST, 'bet is a required parameter') }
  try {
    const enoughCoins = ((Number(wallet.coins) - Number(bet)) >= 0)
    if (!enoughCoins) { throw createError(400, 'Insufficient funds') }
    wallet.coins -= Number(bet)
    const canPlay = checkIfCanPlay()
    if (!canPlay) { return {isWin: false} }
    const payTable = await getPayTable()
    const winRow = await getWinRow(payTable)
    const points = winRow.points
    const filltable = await getFillTable(payTable)
    const winRowFilled = await getWinRowWithEmptyFilled(winRow, filltable)
      // { type: "coins", "ticket", "jackpot" amount: 1...n }
    const type = "coins"
    const isWin = true
    const returnObject = {symbolsData: winRowFilled, points, wallet, isWin, type}
    // return Object.assign({}, winRowFilled, {points, wallet, isWin, type})
    return returnObject
  } catch (error) {
    throw createError(500, error)
  }
}
const getWinRowWithEmptyFilled = (winRow, fillTable) => {
  const winSymbolAmount = winRow.symbol_amount
  const winSymbolPaymentType = winRow.payment_type
  const symbolRowToReturn: any[] = []
  for (let idx = 0; idx < winSymbolAmount; idx++) {
    symbolRowToReturn.push({paymentType: winSymbolPaymentType})
  }
  const symbolsAmountToFill = 3 - winSymbolAmount
  const symbolsForFilling = getSymbolsForFilling(fillTable, winSymbolPaymentType)
  for (let idx = 0; idx < symbolsAmountToFill; idx++) {
    const symbolForFilling = getSymbolForFilling(symbolsForFilling)
    console.log('symbolForFilling', symbolForFilling)
    symbolRowToReturn.push({paymentType: symbolForFilling})
  }
  return symbolRowToReturn
}

const getSymbolForFilling = (symbolsForFilling) => {
  const randomNumber = getRandomNumber(0, symbolsForFilling.length - 1)
  return symbolsForFilling[randomNumber]
}
const getSymbolsForFilling = (symbols, paymentType) =>
  symbols.filter((symbol) => symbol.paymante_type !== paymentType)
    .map((symbol) => symbol.payment_type)
const getPayTable = async () => {
  const conn = await getSlotConnection()
  try {
    const [payTable] = await conn.query(`
      select s.payment_type, pt.symbol_amount, pt.probability, pt.points
        from pay_table pt
      inner join symbol s on s.id = pt.symbol_id`)
    return payTable
  } finally {
    await conn.release()
  }
}
const getFillTable = (payTable) => payTable.filter((rowOf3) => rowOf3.symbol_amount === 3)
const checkIfCanPlay = () => getRandomNumber() > 20
const getRandomNumber = (from = 1, to = 100) => Math.floor((Math.random() * (to + 1)) + from)
const getWinRow = (table) => {
  let probabilityAcumulation = 0
  const randomNumberBetween1and100 = getRandomNumber(1, 100)
  return table.find((row) => {
    probabilityAcumulation += Number(row.probability)
    return (randomNumberBetween1and100 <= probabilityAcumulation)
  })
}
