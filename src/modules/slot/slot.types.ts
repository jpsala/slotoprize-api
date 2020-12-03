export type WinType = 'jackpot' | 'coin' | 'ticket' | 'spin'
export type WinData = { type: WinType, amount: number }
export type CardForSpin = {id: number, setId: number, title: string, stars: number, ownedQuantity: number, textureUrl: string}
export type CardData = {id: number, title: string, stars: number, textureUrl: string}
export type SpinData = { symbolsData: any, isWin: boolean, walletData: Wallet, winData?: WinData, spinCount: number, cardsData?: CardData[] }
export interface Wallet {
  id: number;
  tickets: number;
  coins: number;
  spins: number;
}
// export interface