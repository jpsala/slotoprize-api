/* eslint-disable require-await */

// import { usersConnection } from "./modules/slot/slot.services/webSocket/ws.service"


// eslint-disable-next-line @typescript-eslint/require-await
export const test = async (): Promise<void> => { 
  console.log('Test')
  // const date = new Date(1900, 0, 1)
  // console.log('date', date)
  // setTimeout(() => {
  //   console.log('connected', usersConnection())
  // }, 5000)
  await getSymbolsAtlas()
} 

import { getSymbolsAtlas } from './modules/slot/slot.services/symbol.service'


