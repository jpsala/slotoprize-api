import { getPayTable, getFillTable, getWinRowWithEmptyFilled } from './../spin.service'

export const getLoosePayTable = (): any => getPayTable().then(payTable => {
  console.log('getLose', )
  const row = {}
  const fillTable = getFillTable(payTable)
  const symbolsData = getWinRowWithEmptyFilled(row, fillTable)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return symbolsData
})


export const getLooseSpin = async (): Promise<any> => {
  const symbolsData = await getLoosePayTable()
  return {
    symbolsData,
    "isWin": false,
    "walletData": {
        "coins": 0,
        "tickets": 0,
        "spins": 0
    }
  }
}