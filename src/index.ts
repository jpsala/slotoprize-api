import createApp from './app'

(async function main() {
  const app = await createApp()
  const port = 8888
  const name = 'wopidom api'

  app.listen(port, () => {
    console.info(`${name} started at port ${port}`)
  })
})()
