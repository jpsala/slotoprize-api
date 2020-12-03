import { StatusCodes } from 'http-status-codes'
import { utc } from 'moment'
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable no-param-reassign */
import createHttpError from 'http-errors'
import getSlotConnection from '../../../db'
import { CardData, SpinData, WinType } from "../slot.types"
import { getRandomNumber } from "../../../helpers"
import { setGameUserSpinData , getGameUserLastSpinDate, assignCardToUser } from '../../meta/meta.repo/gameUser.repo'
import { getJackpotLiveRow } from '../slot.repo/jackpot.repo'
import { GameUser } from './../../meta/meta.types'

import * as jackpotService from './jackpot.service'
import { getOrSetGameUserByDeviceId } from './../../meta/meta-services/meta.service'
import { getActiveBetPrice , getActiveEventMultiplier } from './events/events'

import { getSetting } from './settings.service'
import { getWallet, updateWallet } from './wallet.service'
import { getWinningCard } from './spin-card.service'


const randomNumbers: number[] = []
//@URGENT userIsDev is only when the user is dev, not dev-request
export async function spin(deviceId: string, multiplier: number): Promise<SpinData> {
  await checkParamsAndThrowErrorIfFail(deviceId, multiplier)

  const user = await getOrSetGameUserByDeviceId(deviceId)
  const tutorialComplete = (user.tutorialComplete || 0 as number) === 1
  if (!tutorialComplete) return await getSpinDataForIncompleteTutorial()
  
  if(!user.isDev && await spinWasToQuickly(user)) throw createHttpError(StatusCodes.BAD_REQUEST, 'Spin was to quickly')

  const wallet = await getWallet(user)
  console.log('wallet', wallet, user)
  
  if (!wallet) throw createHttpError(createHttpError.BadRequest, 'Something went wrong, Wallet not found for this user, someting went wrong')
  const { spins: spinsInWallet } = wallet
  const { bet, enoughSpins } = getBetAndCheckFunds(multiplier, spinsInWallet)
  if (!enoughSpins) throw createHttpError(400, 'Insufficient funds')

  const {id: jackpotRowId, isJackpot} = await jackpotService.addSpinsToJackpotAndReturnIfIsJackpot(multiplier, user)
  // eslint-disable-next-line prefer-const
  let { winPoints, winType, symbolsData, isWin } = await getWinData(isJackpot)

  if (winType === 'jackpot' || winType === 'ticket') multiplier = 1
  let winAmount = winPoints * multiplier

  let cardsData: CardData[] | undefined = undefined
  // siempre se descuenta el costo del spin
  wallet.spins -= bet
  if (winType === 'jackpot') {
    await jackpotService.sendJackpotWinEvent(user, <number>jackpotRowId) 
    isWin = true
  } else if (isWin) {
    const eventMultiplier = getActiveEventMultiplier(user)
    winAmount = winAmount * eventMultiplier
    if(String(winType).toLocaleLowerCase() === 'card'){
      console.log('wintype is card' )
      cardsData = []
      for (let index = 0; index < multiplier; index++) {
        const data: CardData = await getWinningCard(user.languageCode)
        await assignCardToUser(user.id, data.id)
        console.log('winning card', data)
        // if(!cardData) cardData = [data]
        cardsData.push(data)
      }
      // {id: number, rewardAmount: number, rewardType: string, title: string, stars: number}
    } else  {
      wallet[`${winType}s`] += (winAmount)
    }
  }
  const spinCount = await setGameUserSpinData(user.id)
  await updateWallet(user, wallet)
  const returnData: SpinData = { symbolsData, isWin, walletData: wallet, spinCount }
  if (isWin) returnData.winData = { type: winType, amount: winAmount }
  if(cardsData) returnData.cardsData = cardsData
  return returnData
}

const getSpinDataForIncompleteTutorial = async (): Promise<any> => {
  const coins = Number(await getSetting('initialWalletCoins', '10'))
  const spins = Number(await getSetting('initialWalletSpins', '10'))
  const tickets = Number(await getSetting('initialWallettickets', '10'))
  return {
    "symbolsData": [
        {"paymentType": "coin", "symbolName": "coin", "isPaying": true},
        {"paymentType": "ticket", "symbolName": "ticket", "isPaying": false},
        {"paymentType": "coin", "symbolName": "blueberry", "isPaying": false}
    ],
    "isWin": true,
    "walletData": { coins, tickets, spins },
    "spinCount": 1,
    "winData": { "type": "coin", "amount": coins }
  }
}
const spinWasToQuickly = async (user: GameUser): Promise<boolean> =>
{
  const { last: lastUserSpinawait } = await getGameUserLastSpinDate(user)
  const lastMoment = utc(lastUserSpinawait)
  const nowMoment = utc(new Date())
  const diff = nowMoment.diff(lastMoment)
  const diffInSeconds = diff / 1000
  //spinWasToQuickly 2020-09-21 15:44:55 2020-09-21 15:45:55 0
  console.log('spinWasToQuickly?', lastMoment.format('YYYY-MM-DD HH:mm:ss'), nowMoment.format('YYYY-MM-DD HH:mm:ss'), diffInSeconds, diff )
  return diff <= Number(await getSetting('spinRatioTimer', '10')) * 1000
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const getWinRowWithEmptyFilled = (winRow: any, fillTable: any): any[] => {
  // console.log("getWinRowWithEmptyFilled -> winRow", winRow)
  const winSymbolAmount = winRow.symbol_amount || 0
  const winSymbolSymbolName = winRow.symbol_name || ""
  const winSymbolPaymentType = winRow.payment_type || ""
  const filledSymbolRowToReturn: any[] = []
  for (let idx = 0; idx < winSymbolAmount; idx++)
    filledSymbolRowToReturn.push({ paymentType: winSymbolPaymentType, symbolName: winSymbolSymbolName, isPaying: true })
  // console.log("getWinRowWithEmptyFilled -> winSymbolSymbolName", winSymbolSymbolName.symbol_name)

  // console.log('filledSymbolRowToReturn', filledSymbolRowToReturn)
  const symbolsAmountToFill = 3 - winSymbolAmount
  for (let idx = 0; idx < symbolsAmountToFill; idx++) {
    // const symbolRowsForFilling = getSymbolRowsForFilling(fillTable)
    const symbolRowForFilling = getSymbolForFilling(fillTable, filledSymbolRowToReturn)
    filledSymbolRowToReturn.push({ paymentType: symbolRowForFilling.payment_type, symbolName: symbolRowForFilling.symbol_name, isPaying: false })
  }
  return filledSymbolRowToReturn
}
const getSymbolForFilling = (symbolsForFilling, allreadyFilledSymbols) => {
  // console.log('allreadyFilledSymbols', JSON.stringify(allreadyFilledSymbols))
  const symbolsToReturn = symbolsForFilling.filter((fillingSymbolRow) => {
    if (allreadyFilledSymbols.length === 0)
      return fillingSymbolRow

    const isInValid = allreadyFilledSymbols.find((afSymbol) => {
      const encontrado = (afSymbol.symbolName === fillingSymbolRow.symbol_name)
      // if (!encontrado)
      //   console.log('symbol', fillingSymbolRow.symbol_name)
      return encontrado
    })
    return !isInValid
  })

  const randomNumber = getRandomNumber(0, symbolsToReturn.length - 1)
  // console.log("getSymbolForFilling -> symbolsForFilling[randomNumber]", symbolsForFilling[randomNumber].symbol_name)
  return symbolsToReturn[randomNumber]
}
export const getPayTable = async (): Promise<any> => {
  const conn = await getSlotConnection()
  try {
    const jackpotLiveRow = await getJackpotLiveRow()
    const [payTable] = await conn.query(`
      select s.symbol_name, s.payment_type, pt.symbol_amount, pt.probability, pt.points
        from pay_table pt
      inner join symbol s on s.id = pt.symbol_id
      order by pt.probability asc`)
    for (const row of <any[]>payTable) 
      if (row.payment_type === 'jackpot')
        row.points = jackpotLiveRow?.prize
    return payTable
  } finally {
    conn.destroy()
  }
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const getFillTable = (payTable):any[] =>  {
  const rowsWith3 = payTable.filter((payTableRow) => payTableRow.symbol_amount === 3)
  const rowsWithLessThan3 = payTable.filter((payTableRow) => payTableRow.symbol_amount < 3)
  return rowsWith3.filter((rowWith3) => {
    const isInOtherRow = rowsWithLessThan3.find((rowWithLessThan3) => {
      const found = (rowWithLessThan3.symbol_name === rowWith3.symbol_name)
      return found
    })
    return !isInOtherRow
  })
}
const checkWithRandomIfWins = async () => getRandomNumber() > Number(await getSetting('spinLosePercent', '20'))
const getWinRow = (table) => {
  const randomNumber = getRandomNumber(1, 100)
  if (!randomNumbers[randomNumber]) randomNumbers[randomNumber] = 0
  randomNumbers[randomNumber]++
  let floor = 0
  const winRow = table.find((row) =>
  {
    if(row.payment_type === 'jackpot') return false
    const isWin = ((randomNumber > floor) && (randomNumber <= floor + Number(row.probability)))
    floor += Number(row.probability)
    return isWin
  })
  return winRow
}
async function checkParamsAndThrowErrorIfFail(deviceId: string, multiplier: number): Promise<void> {
  if (!deviceId) throw createHttpError(StatusCodes.BAD_REQUEST, 'deviceId is a required parameter')
  if (!multiplier) throw createHttpError(StatusCodes.BAD_REQUEST, 'multiplier is a required parameter')
  const maxMultiplier = Number(await getSetting('maxMultiplier', '1'))
  if (multiplier > maxMultiplier) throw createHttpError(502, `multiplayer (${multiplier}) is bigger than maxMultiplier setting (${maxMultiplier})`)

}
export function getBetAndCheckFunds(multiplier: number, spins: number): { bet: number, enoughSpins: boolean } {
  const betPrice = Number(getActiveBetPrice() )
  const bet = betPrice * multiplier
  const enoughSpins = ((spins - bet) >= 0)
  return { bet, enoughSpins }
}
async function getWinData(jackpot)
{
  const isWin = await checkWithRandomIfWins()
  const payTable = await getPayTable()
  let winRow
  let winType: WinType
  if (jackpot) {
    winRow = getJackpotRow(payTable)
    winType = 'jackpot'
  } else {
    winRow = isWin ? await getWinRow(payTable) : []
    winType = winRow.payment_type
  }
  const filltable = getFillTable(payTable)

  const symbolsData = getWinRowWithEmptyFilled(winRow, filltable)
  return { winPoints: winRow.points, winType, symbolsData, isWin }
}
function getJackpotRow(payTable) {
  return payTable.find(row => row.payment_type === 'jackpot')
}
