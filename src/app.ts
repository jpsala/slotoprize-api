import express, {Express, Request, Response, NextFunction} from 'express'
import {HttpError} from 'http-errors'
import 'express-async-errors'

// import errorMiddleware from './middleware/error.middleware'
import routes from './routes'

const createApp = (): Express => {

  const app = express()
  app.use(express.json())
  app.use('/api/', routes)
  app.use((error: HttpError, req: Request, res: Response, next: NextFunction) => {
    // console.log('Error catched in error handler: ', error.status || 500)
    console.log("%cError catched in error handler", "color: red; font-size: large")
    console.warn(`%c${JSON.stringify(error, null, 2)}\r{JSON.stringify(error.stack, null, 2)}`, "color: red; font-size: 100%")
    console.warn(`%c${JSON.stringify(error.stack, null, 2)}`, "color: red; font-size: 100%")
    res.status(error.status || 500).json({message: error.message})
  })

  return app
}
export default createApp
