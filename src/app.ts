/* eslint-disable import/default */
import {urlencoded} from "body-parser"
import cors from 'cors'
import 'express-async-errors'
import { HttpError } from 'http-errors'
import express, { json, Express, Request, Response, NextFunction } from 'express'
import routes from './routes'
import './modules/slot/slot.services/events/events'
import { log } from "./log"

const createApp = (): Express => {

  const app = express()

  app.use(json())
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
    log.bright.white.error('App catch:', error)
    if(error.data) console.log('error data', error.data)
    res.status(error.status || 500).json({ message: error.message })
    next()
  })
  return app
}
export default createApp
