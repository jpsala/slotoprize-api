export interface User {
  id: number;
  login: string;
  name: string;
  email: string;
  password?: string;z
}
export interface GameUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  deviceId: string;
  deviceModel: string;
  deviceName: string;
}
