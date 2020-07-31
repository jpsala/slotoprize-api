import { ResultSetHeader } from 'mysql2/promise'
import { exec } from './../../db'
export async function deleteDataInTestDB(): Promise< ResultSetHeader[]> {
  return [
    await exec('delete from raffle_localization'),
    await exec('delete from raffle'),
    await exec('delete from raffle_wins'),
    await exec('delete from raffle_history'),
    await exec('delete from wallet'),
    await exec('delete from last_spin'),
    await exec('delete from game_user '),
  ]
}
export async function insertInSymbol(): Promise<ResultSetHeader[]> {
  const rows = [
    {
      "id": 533,
      "payment_type": "apple",
      "texture_url": "http://wopidom.homelinux.com/public/assets/symbols/live/apple.png"
    },
    {
      "id": 534,
      "payment_type": "avocado",
      "texture_url": "http://wopidom.homelinux.com/public/assets/symbols/live/avocado.png"
    },
    {
      "id": 535,
      "payment_type": "banana",
      "texture_url": "http://wopidom.homelinux.com/public/assets/symbols/live/banana.png"
    },
    {
      "id": 536,
      "payment_type": "blackberry",
      "texture_url": "http://wopidom.homelinux.com/public/assets/symbols/live/blackberry.png"
    },
    {
      "id": 537,
      "payment_type": "blueberry",
      "texture_url": "http://wopidom.homelinux.com/public/assets/symbols/live/blueberry.png"
    },
    {
      "id": 538,
      "payment_type": "cherry",
      "texture_url": "http://wopidom.homelinux.com/public/assets/symbols/live/cherry.png"
    },
    {
      "id": 539,
      "payment_type": "coconut",
      "texture_url": "http://wopidom.homelinux.com/public/assets/symbols/live/coconut.png"
    },
    {
      "id": 540,
      "payment_type": "coin",
      "texture_url": "http://wopidom.homelinux.com/public/assets/symbols/live/coin.png"
    },
    {
      "id": 541,
      "payment_type": "coinbag",
      "texture_url": "http://wopidom.homelinux.com/public/assets/symbols/live/coinbag.png"
    },
    {
      "id": 542,
      "payment_type": "dragonfruit",
      "texture_url": "http://wopidom.homelinux.com/public/assets/symbols/live/dragonfruit.png"
    },
    {
      "id": 543,
      "payment_type": "fig",
      "texture_url": "http://wopidom.homelinux.com/public/assets/symbols/live/fig.png"
    },
    {
      "id": 544,
      "payment_type": "grape",
      "texture_url": "http://wopidom.homelinux.com/public/assets/symbols/live/grape.png"
    },
    {
      "id": 545,
      "payment_type": "jackpot",
      "texture_url": "http://wopidom.homelinux.com/public/assets/symbols/live/jackpot.png"
    },
    {
      "id": 546,
      "payment_type": "kiwi",
      "texture_url": "http://wopidom.homelinux.com/public/assets/symbols/live/kiwi.png"
    },
    {
      "id": 547,
      "payment_type": "lychee",
      "texture_url": "http://wopidom.homelinux.com/public/assets/symbols/live/lychee.png"
    },
    {
      "id": 548,
      "payment_type": "orange",
      "texture_url": "http://wopidom.homelinux.com/public/assets/symbols/live/orange.png"
    },
    {
      "id": 549,
      "payment_type": "papaya",
      "texture_url": "http://wopidom.homelinux.com/public/assets/symbols/live/papaya.png"
    },
    {
      "id": 550,
      "payment_type": "pear",
      "texture_url": "http://wopidom.homelinux.com/public/assets/symbols/live/pear.png"
    },
    {
      "id": 551,
      "payment_type": "pineapple",
      "texture_url": "http://wopidom.homelinux.com/public/assets/symbols/live/pineapple.png"
    },
    {
      "id": 552,
      "payment_type": "pomegranate",
      "texture_url": "http://wopidom.homelinux.com/public/assets/symbols/live/pomegranate.png"
    },
    {
      "id": 553,
      "payment_type": "seven",
      "texture_url": "http://wopidom.homelinux.com/public/assets/symbols/live/seven.png"
    },
    {
      "id": 554,
      "payment_type": "strawberry",
      "texture_url": "http://wopidom.homelinux.com/public/assets/symbols/live/strawberry.png"
    },
    {
      "id": 555,
      "payment_type": "ticket",
      "texture_url": "http://wopidom.homelinux.com/public/assets/symbols/live/ticket.png"
    },
    {
      "id": 556,
      "payment_type": "watermelon",
      "texture_url": "http://wopidom.homelinux.com/public/assets/symbols/live/watermelon.png"
    }
  ]
  const results: ResultSetHeader[] = []
  for (const row of rows)
    results.push(
      await exec('insert into symbol set ? ', row)
    )
  return results
}
export async function insertInPayTable(): Promise<ResultSetHeader[]> {
  const payTableData = [
    {
      "id": 1,
      "symbol_id": 545,
      "symbol_amount": 3,
      "probability": 0.00,
      "points": 1000
    },
    {
      "id": 2,
      "symbol_id": 555,
      "symbol_amount": 3,
      "probability": 0.50,
      "points": 15
    },
    {
      "id": 11,
      "symbol_id": 540,
      "symbol_amount": 3,
      "probability": 1.50,
      "points": 90
    },
    {
      "id": 12,
      "symbol_id": 541,
      "symbol_amount": 3,
      "probability": 1.00,
      "points": 100
    },
    {
      "id": 13,
      "symbol_id": 537,
      "symbol_amount": 3,
      "probability": 2.00,
      "points": 80
    },
    {
      "id": 15,
      "symbol_id": 538,
      "symbol_amount": 3,
      "probability": 3.00,
      "points": 70
    },
    {
      "id": 16,
      "symbol_id": 541,
      "symbol_amount": 2,
      "probability": 13.00,
      "points": 40
    },
    {
      "id": 17,
      "symbol_id": 541,
      "symbol_amount": 1,
      "probability": 19.00,
      "points": 30
    },
    {
      "id": 18,
      "symbol_id": 540,
      "symbol_amount": 2,
      "probability": 22.00,
      "points": 20
    },
    {
      "id": 19,
      "symbol_id": 540,
      "symbol_amount": 1,
      "probability": 25.00,
      "points": 10
    },
    {
      "id": 21,
      "symbol_id": 544,
      "symbol_amount": 3,
      "probability": 5.00,
      "points": 60
    },
    {
      "id": 22,
      "symbol_id": 554,
      "symbol_amount": 3,
      "probability": 8.00,
      "points": 50
    }
  ]
  const results: ResultSetHeader[] = []
  for (const row of payTableData)
    results.push(
      await exec('insert into pay_table set ? ', row)
    )
  return results
}
