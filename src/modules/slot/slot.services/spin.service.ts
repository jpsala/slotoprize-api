/* eslint-disable no-param-reassign */
import createError from 'http-errors'
import getSlotConnection from '../../../db'
import {SpinData} from "../slot.types"
import {getRandomNumber} from "../../../helpers"
import * as walletService from "./wallet.service"
import {getSetting, setSetting} from './settings.service'

const randomNumbers: number[] = []
export async function spin(deviceId: string, multiplier: number): Promise<SpinData> {
  await checkParamsAndThrowErrorIfFail(deviceId, multiplier)

  const wallet = await walletService.getWallet(deviceId)
  if (!wallet) throw createError(createError.BadRequest, 'Something went wrong, Wallet not found for this user, someting went wrong')
  const {coins: coinsInWallet} = wallet
  const {bet, enoughCoins} = await getBetAndCheckFunds(multiplier, coinsInWallet)
  if (!enoughCoins) throw createError(400, 'Insufficient funds')

  await saveSpinToDb(multiplier)
  // eslint-disable-next-line prefer-const
  let {winPoints, winType, symbolsData, isWin} = await getWinData()

  if (winType === 'jackpot' || winType === 'ticket') multiplier = 1
  const winAmount = winPoints * multiplier

  // siempre se descuenta el costo del spin
  wallet.coins -= bet
  if (winType === 'jackpot') {
    resetSpinCount()
    isWin = true
  } else if (isWin)
    {wallet.coins += winAmount}

  walletService.updateWallet(deviceId, wallet)
  const returnData: any = {symbolsData, isWin, wallet}

  if (isWin) returnData.winData = {type: winType, amount: winAmount}

  return returnData
}
const resetSpinCount = async () => {
  await setSetting('spinCount', '0')
}
const saveSpinToDb = async (multiplier: number): Promise <void> => {
  const spinCount = Number(await getSetting('spinCount', multiplier))
  setSetting('spinCount', String(Number(spinCount) + multiplier))
}
const getWinRowWithEmptyFilled = (winRow, fillTable) => {
  // console.log("getWinRowWithEmptyFilled -> winRow", winRow)
  const winSymbolAmount = winRow.symbol_amount || 0
  const winSymbolPaymentType = winRow.payment_type || ""
  const filledSymbolRowToReturn: any[] = []
  for (let idx = 0; idx < winSymbolAmount; idx++)
    filledSymbolRowToReturn.push({paymentType: winSymbolPaymentType, isPaying: true})
    // console.log("getWinRowWithEmptyFilled -> winSymbolPaymentType", winSymbolPaymentType.payment_type)

  // console.log('filledSymbolRowToReturn', filledSymbolRowToReturn)
  const symbolsAmountToFill = 3 - winSymbolAmount
  for (let idx = 0; idx < symbolsAmountToFill; idx++) {
    // const symbolRowsForFilling = getSymbolRowsForFilling(fillTable)
    const symbolRowForFilling = getSymbolForFilling(fillTable, filledSymbolRowToReturn)
    filledSymbolRowToReturn.push({paymentType: symbolRowForFilling.payment_type, isPaying: false})
  }
  return filledSymbolRowToReturn
}
const getSymbolForFilling = (symbolsForFilling, allreadyFilledSymbols) => {
  // console.log('allreadyFilledSymbols', JSON.stringify(allreadyFilledSymbols))
  const symbolsToReturn = symbolsForFilling.filter((fillingSymbolRow) => {
    if (allreadyFilledSymbols.length === 0)
      return fillingSymbolRow

    const isInValid = allreadyFilledSymbols.find((afSymbol) => {
      const encontrado = (afSymbol.paymentType === fillingSymbolRow.payment_type)
      // if (!encontrado)
      //   console.log('symbol', fillingSymbolRow.payment_type)

      return encontrado
    })
    return !isInValid
  })

  const randomNumber = getRandomNumber(0, symbolsToReturn.length - 1)
  // console.log("getSymbolForFilling -> symbolsForFilling[randomNumber]", symbolsForFilling[randomNumber].payment_type)
  return symbolsToReturn[randomNumber]
}
export const getPayTable = async ():Promise <any> => {
  const conn = await getSlotConnection()
  try {
    const [payTable] = await conn.query(`
      select s.payment_type, pt.symbol_amount, pt.probability, pt.points
        from pay_table pt
      inner join symbol s on s.id = pt.symbol_id
      order by pt.probability asc`)
    return payTable
  } finally {
    await conn.destroy()
  }
}
const getFillTable = (payTable) => {
  const rowsWith3 = payTable.filter((payTableRow) => payTableRow.symbol_amount === 3)
  const rowsWithLessThan3 = payTable.filter((payTableRow) => payTableRow.symbol_amount < 3)
  return rowsWith3.filter((rowWith3) => {
    const isInOtherRow = rowsWithLessThan3.find((rowWithLessThan3) => {
      const found = (rowWithLessThan3.payment_type === rowWith3.payment_type)
      return found
    })
    return !isInOtherRow
  })
}
const checkWithRandomIfWins = () => getRandomNumber() > 20
const getWinRow = (table) => {
  const randomNumber = getRandomNumber(1, 100)
  if (!randomNumbers[randomNumber]) randomNumbers[randomNumber] = 0
  randomNumbers[randomNumber]++
  let floor = 0
  const winRow = table.find((row) => {
    const isWin = ((randomNumber > floor) && (randomNumber <= floor + Number(row.probability)))
    floor += Number(row.probability)
    return isWin
  })
  return winRow
}
async function checkParamsAndThrowErrorIfFail(deviceId: string, multiplier: number): Promise<void> {
  if (!deviceId) throw createError(createError.BadRequest, 'deviceId is a required parameter')
  if (!multiplier) throw createError(createError.BadRequest, 'multiplier is a required parameter')
  const maxMultiplier = Number(await getSetting('maxMultiplier', '1'))
  if (multiplier > maxMultiplier) throw createError(createError[502], `multiplayer (${multiplier}) is bigger than maxMultiplier setting (${maxMultiplier})`)

}
export async function getBetAndCheckFunds(multiplier: number, coins: any) {
  const betPrice = Number(await getSetting('betPrice', 1))
  const bet = betPrice * multiplier
  const enoughCoins = ((coins - bet) >= 0)
  return {bet, enoughCoins}
}
async function getWinData() {
  const isWin = checkWithRandomIfWins()
  // @TODO Quitar
  // const isWin = false
  const payTable = await getPayTable()
  let winRow
  let winType
  const spinCount = Number(await getSetting('spinCount', 0))
  // const jackpot = (spinCount >= 1000000)
  const jackpot = (spinCount >= 10)
  if (jackpot) {
    winRow = getJackpotRow(payTable)
    winType = 'jackpot'
  } else {
    winRow = isWin ? await getWinRow(payTable) : []
    winType = winRow.payment_type === 'ticket' ? 'ticket' : 'coin'
  }
  const filltable = await getFillTable(payTable)

  const symbolsData = await getWinRowWithEmptyFilled(winRow, filltable)
  return {winPoints: winRow.points, winType, symbolsData, isWin}
}
function getJackpotRow(payTable) {
  return payTable[0]
}
