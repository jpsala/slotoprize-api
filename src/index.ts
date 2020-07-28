import WebSocket from 'ws'
import createApp from './app'
import './modules/slot/slot.commands'
void (function main() {
  const app = createApp()
  const port = 8888
  const name = 'wopidom api'
  app.listen(port, () => {
    console.info(`${name} started at port ${port}`)
  })
  setTimeout(() => {
    const client = new WebSocket('ws://localhost:8890')
    // const client = new WebSocket('ws://wopidom.homelinux.com:8890/ws/chat')
    client.on('open', function () {
      client.send(JSON.stringify({ "command": "getEventState", "eventType": "happyHour" }))
      console.log('client sended')
    })
    client.on('message', function (a, b) {
      console.warn('msg received from server', a, b)
    })
  }, 3000)
})()
