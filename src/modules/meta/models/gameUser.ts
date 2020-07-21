import faker from 'faker'
import { Wallet } from '.'

export interface GameUser {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  deviceId: string;
  deviceModel: string;
  deviceName: string;
  countryPhoneCode: string;
  phoneNumber: string;
  createdAt?: Date;
  modifiedAt?: Date;
  password: string;
  phoneCode: string;
  languageCode: string;
  isMale: boolean;
  age: string;
  address: string;
  city: string;
  zipCode: string;
  state: string;
  country: string;
  isNew: boolean;
  wallet: Wallet;
}
export const fakeUser = (override: Partial<GameUser> = {}): GameUser => {
  return {
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    email: faker.internet.email(),
    deviceId: 'device1',
    deviceModel: faker.lorem.word(),
    deviceName: faker.lorem.word(),
    countryPhoneCode: faker.address.countryCode(),
    phoneCode: faker.lorem.word().substr(0, 2),
    phoneNumber: faker.phone.phoneNumber().substr(0, 19),
    createdAt: faker.date.past(),
    modifiedAt: faker.date.past(),
    password: faker.internet.password(),
    languageCode: 'en-US',
    isMale: faker.random.boolean(),
    age: String(faker.random.number(80) + 10),
    address: faker.address.streetAddress(),
    city: faker.address.city(),
    zipCode: faker.address.zipCode(),
    state: faker.address.state(),
    country: faker.address.country(),
    isNew: false,
    wallet: {
      coins: faker.random.number(100),
      tickets: faker.random.number(100)
    }, ...override
  }
}

export const createGameUser = (userProps: Partial<GameUser> = {}): GameUser => {
  const user = {
    firstName: '',
    lastName: '',
    email: '',
    deviceId: '',
    deviceModel: '',
    deviceName: '',
    countryPhoneCode: '',
    phoneNumber: '',
    password: '',
    phoneCode: '',
    languageCode: '',
    isMale: true,
    age: '',
    address: '',
    city: '',
    zipCode: '',
    state: '',
    country: '',
    isNew: true,
    wallet: {
      coins: 0,
      tickets: 0
    }
  }
  return { ...user, ...userProps } as GameUser

}