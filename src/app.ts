/* eslint-disable import/default */
import {urlencoded} from "body-parser"
import cors from 'cors'
import 'express-async-errors'
import { HttpError } from 'http-errors'
import routes from './routes'
import express, { Express, Request, Response, NextFunction } from 'express'
import './modules/slot/slot.services/events/events'
import './modules/slot/slot.services/webSocket/ws'

const createApp = (): Express => {

  const app = express()

  app.use(express.json())
  app.use(cors())
  app.use('*', (req, res, next) => {
    res.setHeader('Access-Control-Expose-Headers', '*')
    res.setHeader('Access-Control-Allow-Origin', '*')
    next()
  })
  app.use(urlencoded({ extended: true }))
  app.use('/api/', routes)
  app.use((req, res) => {
    console.log('req.route.path', req.path)
    res.status(404).json({ message: `${req.path} not found!` })
  })
  app.use((error: HttpError, req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV !== 'testing')
      console.error(error)
    res.status(error.status || 500).json({ message: error.message })
  })
  return app
}
export default createApp
