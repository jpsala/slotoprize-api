import { wsServer } from './modules/slot/slot.services/webSocket/ws.service'
import createApp from './app'
import './modules/slot/slot.commands'
import { spinRegenerationInit, shutDown as spinRegenerationShutDown } from './modules/slot/slot.repo/spin.regeneration.repo'
import { Server } from 'http'

const https = require('https');
const fs = require('fs');
const os = require('os');
let server: Server
const hostname = os.hostname();

void (async function main() {
  await spinRegenerationInit()
  process.on('SIGINT', () =>
  {
    void sendShutDownMessageToHooksAndShutdown()
  })
  process.on('SIGINT', () =>
  {
    void sendShutDownMessageToHooksAndShutdown()
  })
  async function sendShutDownMessageToHooksAndShutdown(): Promise<void>{
    console.log('shutting down...')
    console.log('shutting down api, waiting processes to end')
    await spinRegenerationShutDown()
    console.log('shutting down express')
    wsServer.shutDown()
    server.close(() =>
    {
      console.log('server closed' )
      process.exit(0)
    })
  }
  const app = createApp()
  const port = 8888
  const name = 'wopidom api'
  server = app.listen(port, () => {
    console.info(`${name} started at port ${port}`)
  })
  console.log('hostname', os.hostname())
  if (os.hostname() === 'slotoprizes') {
    https.createServer({
      key: fs.readFileSync('/home/jpsala/privkey.pem'),
      // key: fs.readFileSync('/home/jpsala/certs/privkey1.pem'),
      cert: fs.readFileSync('/home/jpsala/fullchain.pem'),
      // cert: fs.readFileSync('/home/jpsala/certs/fullchain1.pem'),
    }, app).listen(3000, () => {
      console.log(`started on ${hostname} on port 3000 - ${process.env.NODE_ENV ?? ''}`);
    });
  }
})()
