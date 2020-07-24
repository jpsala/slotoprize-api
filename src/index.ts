import './modules/slot/slot.services/webSocket/ws'
import createApp from './app'
void (function main() {
  const app = createApp()
  const port = 8888
  const name = 'wopidom api'
  app.listen(port, () => {
    console.info(`${name} started at port ${port}`)
  })
})()
