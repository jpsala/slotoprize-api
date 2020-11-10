export type WinType = 'jackpot' | 'coin' | 'ticket' | 'spin'
export type WinData = { type: WinType, amount: number }
export type SpinData = { symbolsData: any, isWin: boolean, walletData: Wallet, winData?: WinData, spinNumber: number }
export interface Wallet {
  id: number;
  tickets: number;
  coins: number;
  spins: number;
}
// export interface