import { getLooseSpin } from './spinLoose'

it('spin loose', async () =>
{
  const symbolsData = await getLooseSpin()
  console.log(symbolsData)
})
/*
{
    "symbolsData": [
        {
          getLoosePayTable  "paymentType": "blueberry",
            "isPaying": false
        },
        {
            "paymentType": "grape",
            "isPaying": false
        },
        {
            "paymentType": "cherry",
            "isPaying": false
        }
    ],
    "isWin": false,
    "walletData": {
        "coins": 7670,
        "tickets": 60
    }
}
*/