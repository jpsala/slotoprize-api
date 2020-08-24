// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ReqUser } from "../../models/reqUser"

declare global {
  namespace Express {
    interface Request {
      user: ReqUser,
      fields: any,
      files: any
    }
  }
}