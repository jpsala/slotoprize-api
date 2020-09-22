import createError from 'http-errors'
import { INTERNAL_SERVER_ERROR } from 'http-status-codes'
import { queryOne, exec } from '../../../db'
import {Wallet} from '../slot.types'
import { getSetting } from './../slot.services/settings.service'
import { GameUser } from './../../meta/meta.types'
import { userChanged, userAdded } from './spin.regeneration.repo'

export const getWallet = async (user: GameUser): Promise<Wallet> =>
{
  return (await queryOne(
    `select coins, tickets, spins from wallet where game_user_id ='${user.id}'`
    )) as Wallet
  }
  export async function updateWallet( user: GameUser, wallet: Wallet ): Promise<Wallet> {
  userChanged(user, wallet.spins)
  const respUpdateRow = await exec(`
  update wallet
  set coins = ${wallet.coins}, tickets = ${wallet.tickets}, spins = ${wallet.spins}
  where game_user_id = ${user.id}
  `)
  if (Number(respUpdateRow.affectedRows) !== 1)
  throw createError( INTERNAL_SERVER_ERROR, 'Something whent wrong storing the wallet' )
  return wallet
}
export async function insertWallet(user: GameUser, coins?: number, spins?: number, tickets?: number):
Promise<Wallet>
{
  coins = coins ?? Number(await getSetting('initialWalletCoins', '10'))
  spins = spins ?? Number(await getSetting('initialWalletSpins', '10'))
  tickets = tickets ?? Number(await getSetting('initialWallettickets', '10'))
  type WalletDto = Omit<Wallet, 'id'> & { game_user_id: number, id?: number }
    // type WalletDto = {game_user_id: number, coins: number, spins: nu, tickets, id?: number}
  const walletDto: WalletDto = {game_user_id: user.id, coins, spins, tickets}
  const respInsert = await exec(`insert into wallet set ?`, walletDto)
  if (Number(respInsert.insertId) <= 0)
    throw createError( INTERNAL_SERVER_ERROR, 'Something whent wrong storing the wallet' )
  walletDto.id = respInsert.insertId
  await userAdded(user, spins)

  return walletDto as Wallet & { game_user_id: number, id: number }
}
