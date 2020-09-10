
import {Wallet} from '../slot.types'
import * as wallerRepo from '../slot.repo/wallet.repo'
import { GameUser } from './../../meta/meta.types'

export async function updateWallet( user: GameUser, wallet: Wallet ): Promise<Wallet> {
  return await wallerRepo.updateWallet(user, wallet)
}

// export const getOrSetWallet = async (
  //     deviceId: string
  // ): Promise<any> =>
  // {
  //   const user = await getGameUserByDeviceId(deviceId)
  //   const wallet = await getWallet(user)
  //   if (!wallet) {
  //     const tickets = Number(
  //             await getSetting('initialWalletTickets', '10')
  //         )
  //     const coins = Number(
  //             await getSetting('initialWalletCoins', '10')
  //         )
  //     const spins = Number(
  //       await getSetting('initialWalletSpins', '10')
  //     )
  //     const insertedWallet = await wallerRepo.insertWallet(user, coins, tickets, spins)

  //     return insertedWallet
  //   }
  //   return wallet
  // }
export const getWallet = async (user: GameUser): Promise<Wallet> => {
  return await wallerRepo.getWallet(user)
}
export async function insertWallet(user: GameUser, coins?: number, spins?: number, tickets?: number):
  Promise<Wallet>
{
  return await wallerRepo.insertWallet(user, coins, spins, tickets)
}