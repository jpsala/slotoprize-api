import createError from 'http-errors'
import * as httpStatusCodes from "http-status-codes"
import getSlotConnection from '../db.slot'
import {SpinData} from "../slot.types"
import {queryOne, exec} from '../../meta/meta.db'
import * as walletService from "./wallet.service"
import {settingGet, settingSet} from './settings.service'

export async function spin(deviceId: string, multiplier: number): Promise<SpinData> {
  checkParamsAndThrowErrorIfFail(deviceId, multiplier)

  const wallet = await walletService.getWallet(deviceId)
  if (!wallet) { throw createError(httpStatusCodes.BAD_REQUEST, 'Something went wrong, Wallet not found for this user, someting went wrong') }
  const {coins: coinsInWallet} = wallet
  const {bet, enoughCoins} = await getBetAndCheckFunds(multiplier, coinsInWallet)
  if (!enoughCoins) { throw createError(400, 'Insufficient funds') }

  await saveSpinToDb(multiplier)

  const {winPoints, winType, winSymbolsData, isWin} = await getWinData()

  const amount = isWin ? winPoints * bet : bet

  if (winType === 'jackpot') {
    resetSpinCount()
  } else {
    updateWalletTicketsOrCoins(wallet, winType, amount, isWin)
    walletService.updateWallet(deviceId, wallet)
  }

  const returnData: any = {symbolsData: winSymbolsData, isWin, wallet}

  if (isWin) { returnData.winData = {type: winType, amount} }

  return returnData
}
const resetSpinCount = async () => {
  await settingSet('spinCount', '0')
}
const saveSpinToDb = async (multiplier: number): Promise <void> => {
  const spinCount = await settingGet('spinCount', String(multiplier))
  settingSet('spinCount', String(Number(spinCount) + multiplier))
}
const getWinRowWithEmptyFilled = (winRow, fillTable) => {
  const winSymbolAmount = winRow.symbol_amount || 0
  const winSymbolPaymentType = winRow.payment_type || ""
  const symbolRowToReturn: any[] = []
  for (let idx = 0; idx < winSymbolAmount; idx++) {
    symbolRowToReturn.push({paymentType: winSymbolPaymentType})
  }
  const symbolsAmountToFill = 3 - winSymbolAmount
  const symbolsForFilling = getSymbolsForFilling(fillTable, winSymbolPaymentType)
  for (let idx = 0; idx < symbolsAmountToFill; idx++) {
    const symbolForFilling = getSymbolForFilling(symbolsForFilling)
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
const checkWithRandomIfWins = () => getRandomNumber() > 20
const getRandomNumber = (from = 1, to = 100) => Math.floor((Math.random() * (to + 1)) + from)
const getWinRow = (table) => {
  const randomNumber = getRandomNumber(1, 100)
  let floor = 0
  const winRow = table.find((row) => {
    const isWin = ((randomNumber > floor) && (randomNumber <= floor + Number(row.probability)))
    floor += Number(row.probability)
    return isWin
  })
  return winRow
}
function updateWalletTicketsOrCoins(wallet: any, winType: string, amount: number, isWin: boolean) {
  wallet[winType] += (amount * (isWin ? 1 : -1))
}
function checkParamsAndThrowErrorIfFail(deviceId: string, multiplier: number) {
  if (!deviceId) { throw createError(httpStatusCodes.BAD_REQUEST, 'deviceId is a required parameter') }
  if (!multiplier) { throw createError(httpStatusCodes.BAD_REQUEST, 'multiplier is a required parameter') }
}
async function getBetAndCheckFunds(multiplier: number, coins: any) {
  const spinCost = Number(await settingGet('spinCost', 1))
  const bet = spinCost * multiplier
  const enoughCoins = ((coins - bet) >= 0)
  return {bet, enoughCoins}
}
async function getWinData() {
  const isWin = checkWithRandomIfWins()
  // const jackpot = (spinCount >= 1000000)
  const payTable = await getPayTable()
  let winRow
  let winType
  const spinCount = Number(await settingGet('spinCount', 0))
  const jackpot = (spinCount >= 2)
  if (jackpot) {
    winRow = getJackpotRow(payTable)
    winType = 'jackpot'
  } else {
    winRow = isWin ? await getWinRow(payTable) : []
    winType = winRow.paymentType === 'ticket' ? 'ticket' : 'coins'
  }
  const filltable = await getFillTable(payTable)
  const winSymbolsData = await getWinRowWithEmptyFilled(winRow, filltable)
  return {winPoints: winRow.points, winType, winSymbolsData, isWin}
}
function getJackpotRow(payTable) {
  return payTable[0]
}
