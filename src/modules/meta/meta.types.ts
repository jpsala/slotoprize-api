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
  isMale: boolean;
  age: number;
  address: string;
  city: string;
  zipCode: string;
  state: string;
  country: string;
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
  textureUr: string;
  raffleNumberPrice: number
  itemHighlight: boolean;
  rafflePrizesLocalizationData: RafflePrizeLocalizationData[];
}
export interface RafflePrizeLocalizationData{
  id: number;
  raffleId: number;
  languageCode: string;
  name: string;
  description: string;
}

export interface RaffleHistory {
  id: number;
  gameUser: GameUser;
  raffle: RafflePrizeData;
  transactionDate: Date;
  ticketsUsed: number;
  expirationDate: Date;
  participations: number;
}