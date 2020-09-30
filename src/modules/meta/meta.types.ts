import faker from 'faker'
import { Wallet } from './../slot/slot.types'
/* eslint-disable babel/camelcase */

export interface User {
  id: number;
  login: string;
  name: string;
  email: string;
  password?: string;
}
export interface State {
  id: number;
  name: string;
  countryId: number;
}
export interface Country {
  id: number;
  name: string;
  phonePrefix: string;
  states?: State[];
}
export interface GameUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  deviceId: string;
  deviceModel: string;
  deviceName: string;
  phoneNumber: string;
  createdAt?: Date;
  modifiedAt?: Date;
  password: string;
  phoneCode: string;
  languageCode: string;
  isMale: boolean;
  age: number;
  address: string;
  city: string;
  zipCode: string;
  state: string;
  country: string;
  isNew: boolean;
  isDev: boolean;
  
  advertisingId?: string;
  // wallet?: Partial<Wallet>;
  wallet?: Wallet;
}
export const fakeUser = (override: Partial<GameUser> = {}): GameUser => {
  return {
    id: -1,
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    email: faker.internet.email(),
    deviceId: 'fakeDevice1',
    deviceModel: faker.lorem.word(),
    deviceName: faker.lorem.word(),
    phoneCode: faker.lorem.word().substr(0, 2),
    phoneNumber: faker.phone.phoneNumber().substr(0, 19),
    createdAt: faker.date.past(),
    modifiedAt: faker.date.past(),
    password: faker.internet.password(),
    languageCode: 'en-US',
    isMale: faker.random.boolean(),
    age: faker.random.number(80) + 10,
    address: faker.address.streetAddress(),
    city: faker.address.city(),
    zipCode: faker.address.zipCode(),
    state: faker.address.state(),
    country: faker.address.country(),
    isDev: false,
    isNew: false,
    wallet: {
      id: -1,
      coins: faker.random.number(100),
      tickets: faker.random.number(100),
      spins: faker.random.number(100)
    }, ...override
  }
}
export interface LanguageData {
  id: number;
  languageCode: string;
  textureUrl: string;
  localizationUrl: string;
}
export interface RafflePrizeData {
  id: number;
  closingDate: Date;
  textureUrl: string;
  raffleNumberPrice: number
  itemHighlight: boolean;
  name?: string;
  description?: string;
  localizationData: LocalizationData[];
  winner?: number;
  closed?: boolean;
}
export interface RafflePrizeDataDB {
  id: number;
  closing_date: Date;
  texture_url: string;
  raffle_number_price: number
  item_highlight: boolean;
  localizationData: LocalizationDataDB[];
}
export interface LocalizationData{
  id: number;
  raffleId: number;
  languageCode: string;
  name: string;
  description: string;
}
export interface LocalizationDataDB{
  id: number;
  raffle_id: number;
  language_code: string;
  name: string;
  description: string;
}
export interface RaffleRecordData {
  id: number;
  gameUser: GameUser;
  transactionDate: Date;
  tickets: number;
  closingDate: Date;
  raffleNumbers: number;
  raffleItemId: number;
}
