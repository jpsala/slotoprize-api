import { wsServer } from './modules/slot/slot.services/webSocket/ws.service'
import createApp from './app'
import './modules/slot/slot.commands'
import { spinRegenerationInit, shutDown as spinRegenerationShutDown } from './modules/slot/slot.repo/spin.regeneration.repo'
import { Server } from 'http'

let server: Server

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
})()
