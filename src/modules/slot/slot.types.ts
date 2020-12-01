export type WinType = 'jackpot' | 'coin' | 'ticket' | 'spin'
export type WinData = { type: WinType, amount: number }
export type CardForSpin = {id: number, rewardAmount: number, rewardType: string, title: string, stars: number, ownedQuantity: number}
export type CardData = {id: number, rewardAmount: number, rewardType: string, title: string, stars: number}
export type SpinData = { symbolsData: any, isWin: boolean, walletData: Wallet, winData?: WinData, spinCount: number, cardData?: CardData }
export interface Wallet {
  id: number;
  tickets: number;
  coins: number;
  spins: number;
}
// export interface