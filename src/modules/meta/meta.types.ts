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
  countryPhoneCode: string;
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
}
export interface RafflePrizeDataDB {
  id: number;
  closing_date: Date;
  texture_url: string;
  raffle_number_price: number
  item_highlight: boolean;
  localization_data: LocalizationDataDB[];
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
