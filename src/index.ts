import { spinRegenerationInit, shutDown as spinRegenerationShutDown } from '@src/modules/slot/slot.repo/spin.regeneration.repo'
import { wsServer } from './modules/slot/slot.services/webSocket/ws.service'
import createApp from './app'
import './modules/slot/slot.commands'


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
    console.log('shutting down api, waiting processes to end')
    await spinRegenerationShutDown()
    wsServer.shutDown()
    console.log('shutting down...')
    process.exit(0)
  }
  const app = createApp()
  const port = 8888
  const name = 'wopidom api'
  app.listen(port, () => {
    console.info(`${name} started at port ${port}`)
  })
})()
