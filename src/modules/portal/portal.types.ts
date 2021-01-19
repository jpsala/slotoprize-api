export type PortalUser = {
  id?: number,
  password: string,
  deviceId: string,
  firstName: string,
  lastName: string,
  email: string
}
export type GoogleUser = {
  id: number,
  name:string,
  givenName:string,
  familyName:string,
  imageUrl:string,
  email:string,
  deviceId?: string
}
type GameDataUser = {
  id: number,
  deviceId: string,
  name: string,
  email: string,

}
export type GameData = {
  user: GameDataUser,
  maxMultiplier: number,
  token: string,
}