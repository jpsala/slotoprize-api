/* eslint-disable @typescript-eslint/restrict-template-expressions */
import WebSocket from 'ws'

const WebSocketServer = WebSocket.Server
export const wsServer = (): void => {
  const wss = new WebSocketServer({
    port: 3001
  })

  wss.on('connection', function (ws) {
    console.log(`[SERVER] connection()`)
    ws.on('message', function (message) {
      console.log(`[SERVER] Received: ${message}`)
      setTimeout(() => {
        ws.send(`What's your name?`, (err) => {
          if (err)
            console.log(`[SERVER] error: ${err}`)

        })
      }, 1000)
    })
  })

}
wsServer()

console.log('ws server started at port 3001...')

// client test:

let count = 0

const ws = new WebSocket('ws://127.0.0.1:3001/ws/chat')

ws.on('open', function () {
  console.log(`[CLIENT] open()`)
  ws.send('Hello!')
})

ws.on('message', function (message) {
  console.log(`[CLIENT] Received: ${message}`)
  count++
  if (count > 3) {
    ws.send('Goodbye!')
    ws.close()
  } else {
    setTimeout(() => {
      ws.send(`Hello, I'm Mr No.${count}!`)
    }, 1000)
  }
})