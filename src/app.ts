import express, {Express, Request, Response, NextFunction} from 'express'
import bodyParser from "body-parser"
import cors from 'cors'

import {HttpError} from 'http-errors'
import 'express-async-errors'

// import errorMiddleware from './middleware/error.middleware'
import multer from "multer"
import routes from './routes'
import './modules/meta/meta-services/cron'

const upload = multer()

const createApp = (): Express => {

  const app = express()
  app.use(express.json())
  app.use(cors())
  app.use('*', (req, res, next) => {
    res.setHeader('Access-Control-Expose-Headers', '*')
    res.setHeader('Access-Control-Allow-Origin', '*')
    next()
  })
  app.use(bodyParser.urlencoded({extended: true}))
  app.use(upload.array())
  app.use('/api/', routes)
  app.use((error: HttpError, req: Request, res: Response, next: NextFunction) => {
    // console.log('Error catched in error handler: ', error.status || 500)
    // console.log("%cError catched in error handler", "color: red; font-size: large")
    console.error(error)
    // console.warn(`%c${JSON.stringify(error, null, 2)}\r{JSON.stringify(error.stack, null, 2)}`, "color: red; font-size: 100%")
    // console.warn(`%c${JSON.stringify(error.stack, null, 2)}`, "color: red; font-size: 100%")
    res.status(error.status || 500).json({message: error.message})
  })

  return app
}
export default createApp
