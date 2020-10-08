import crypto, { Utf8AsciiLatin1Encoding } from 'crypto'
import queryString from 'querystring'
import { format } from 'util'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function appodealCallback(data1: string, data2: string, dev: boolean): void {
  //Encryption key you set for the app in dashboard
  // const encryptionKey = "encryptionKeyForAppodeal9405"
  const encryptionKey = "qwerty"
  //data1 and data2 sent as GET parameters
  // const data1 = "02A87383F97008D2F8898DA81A39EDAF"
  // const data2 = "839EA3731891B24D8025F447747F097664DB4F6A1B88351796EFF7234BE99B21A8E6176F7515C0E4520E898BE97F1B50D48F9979DE6B96822CA9E4DAB6094076E71A2898DC22632FEE638F611334B08557964783B9F98C10D2B841C2182ED5F707F569143431847800EDA5C0D2FFE8BC2550D4F16850F57DBE4315404D10BA295D724A30BB3B2FB6FB72F74624819D5F89AEFB73E8C8EE0D61E8224E749C6BC8"

  //Decrypting data1 and data2

  const keyBytes = crypto.createHash('sha256').update(encryptionKey, 'utf-8' as Utf8AsciiLatin1Encoding).digest()
  const ivBytes = Buffer.from(data1, "hex")
  const cipher = crypto.createDecipheriv('aes-256-cbc', keyBytes, ivBytes)
  const decrypted = cipher.update(data2, 'hex', 'utf8') + cipher.final('utf8')
  const queryParams = queryString.parse(decrypted)

  //User ID set using Appodeal.getUserSettings(this).setUserId("User#123") method in your app
  const userId = queryParams["user_id"]
  //Reward amount
  const amount = queryParams["amount"]
  //Reward currency
  const currency = queryParams["currency"]
  //Unique impression ID in the UUID form
  const impressionId = queryParams["impression_id"]
  //Timestamp of the impression
  const timestamp = queryParams["timestamp"]
  //Hash of the data used for validity confirmation
  const hash = queryParams["hash"]

  //Hash of the data calculation
  const hashString = crypto.createHash('sha1').update(format("user_id=%s&amount=%s&currency=%s&impression_id=%s&timestamp=%s", userId, amount, currency, impressionId, timestamp)).digest('hex')

  console.log('timeStamp data', new Date(String(timestamp)))
  console.log('userId %O, amount %O, currency %O, impressionId %O, timestamp %O hash %o', userId, amount, currency, impressionId, timestamp, hash)
  //If hashes match impression is valid
  if ((<string>hash).toUpperCase() === hashString.toUpperCase()) 
    //Validate amount and currency
    //Check impression_id for uniqueness
    //Add funds to user balance
    console.log("Funds added")

}