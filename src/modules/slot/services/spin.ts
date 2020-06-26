import createError from 'http-errors'
import * as httpStatusCodes from "http-status-codes"
import getSlotConnection from '../db.slot'
import {settingGet, settingSet} from './settings'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default async function spin(deviceId: string, multiplier: string | number, wallet: any): Promise<any> {
  if (!deviceId) { throw createError(httpStatusCodes.BAD_REQUEST, 'deviceId is a required parameter') }
  if (!multiplier) { throw createError(httpStatusCodes.BAD_REQUEST, 'multiplier is a required parameter') }
  try {
    const spinCount = await settingGet('spinCount', '0') as number
    if(Number(spinCount) > 1) return 'Jackpot'
    // if(Number(spinCount) === 1000000) throw createError(200, 'Jackpot')
    const spinCost = await settingGet('spinCost', '1') as number
    const bet = spinCost * Number(multiplier)
    const enoughCoins = ((Number(wallet.coins) - Number(bet)) >= 0)
    if (!enoughCoins) { throw createError(400, 'Insufficient funds') }
    const canPlay = checkIfCanPlay()
    saveSpinToDb()
    if (!canPlay) { return {isWin: false, wallet} }
    wallet.coins -= Number(bet)
    const payTable = await getPayTable()
    const winRow = await getWinRow(payTable)
    if (!winRow) { throw createError(httpStatusCodes.INTERNAL_SERVER_ERROR, 'getWinRow falló!!! reportar a JP :)') }
    const amount = winRow.points * Number(multiplier)
    const filltable = await getFillTable(payTable)
    const symbolsData = await getWinRowWithEmptyFilled(winRow, filltable)
    const type = winRow.paymentType === 'ticket' ? 'ticket' : 'coins'
    return {symbolsData, winData: {type, amount}, wallet, isWin: true}
  } catch (error) {
    throw createError(500, error)
  }
}
const saveSpinToDb = async (): Promise <void> => {
  const spinCount = await settingGet('spinCount', '0')
  settingSet('spinCount', String(Number(spinCount) + 1))
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
      inner join symbol s on s.id = pt.symbol_id
      order by pt.probability asc`)
    return payTable
  } finally {
    await conn.release()
  }
}
const getFillTable = (payTable) => payTable.filter((rowOf3) => rowOf3.symbol_amount === 3)
const checkIfCanPlay = () => getRandomNumber() > 20
const getRandomNumber = (from = 1, to = 100) => Math.floor((Math.random() * (to + 1)) + from)
const getWinRow = (table) => {
  const randomNumberBetween1and100 = getRandomNumber(1, 100)
  console.log("getWinRow -> randomNumberBetween1and100", randomNumberBetween1and100)
  // @TODO shuffle before run
  let winRow = table.find((row) => randomNumberBetween1and100 <= Number(row.probability))
  // let probabilityAcumulation = 0
  // const winRow = table.find((row) => {
    // probabilityAcumulation += Number(row.probability)
    // return (randomNumberBetween1and100 <= probabilityAcumulation)
    // return (randomNumberBetween1and100 <= Number(row.probability))
  // })
  if (!winRow) { winRow = getWinRow(table) }
  return winRow
}
