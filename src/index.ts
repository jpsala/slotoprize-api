/* eslint-disable @typescript-eslint/no-misused-promises */
import https from 'https'
import fs from 'fs'
import os from 'os'
import { init as configInit } from './modules/slot/slot.services/settings.service'
import createApp from './app'
import './modules/slot/slot.commands'
import { spinRegenerationInit, shutDown as spinRegenerationShutDown } from './modules/slot/slot.repo/spin.regeneration.repo'
import { createWsServerService, wsServer } from './modules/slot/slot.services/webSocket/ws.service'
//master
let server
const hostname = os.hostname()

void (function main() {
  process.on('SIGINT', () =>
  {
    void sendShutDownMessageToHooksAndShutdown()
  })
  async function sendShutDownMessageToHooksAndShutdown(): Promise<void>{
    console.log('shutting down...')
    console.log('shutting down api, waiting processes to end')
    await spinRegenerationShutDown()
    console.log('shutting down express, wait for "server closed" message')
    wsServer.shutDown()
    server.close(() =>
    {
      console.log('server closed' )
      process.exit(0)
    })
  }
  const app = createApp()
  const name = 'wopidom api'
  console.log('hostname', os.hostname())
  if (os.hostname() === 'slotoprizes' || (os.hostname() === 'sloto-dev')) {
    server = https.createServer({
      key: fs.readFileSync('/home/jpsala/privkey.pem'),
      // key: fs.readFileSync('/home/jpsala/certs/privkey1.pem'),
      cert: fs.readFileSync('/home/jpsala/fullchain.pem'),
      // cert: fs.readFileSync('/home/jpsala/certs/fullchain1.pem'),
    }, app).listen(3000, async () =>
    {
      console.log(`started on ${hostname} on port 3000`)
      await configInit()
      await spinRegenerationInit()
    })
    createWsServerService(server)
  } else {
    createWsServerService()
    server = app.listen(8888, async () =>
    {
      console.info(`${name} started at port ${8888}, not encripted`)
      await configInit()
      await spinRegenerationInit()
    })
  }
})()
