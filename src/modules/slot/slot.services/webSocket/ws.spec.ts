import ws from 'ws'

it('get client', () => {
  const client = new ws("ws://localhost:8890")
  console.log(
    client.on('connected', (a) => {
      console.log('holaaa')
    })
    // client.send('hola')
  )
})

