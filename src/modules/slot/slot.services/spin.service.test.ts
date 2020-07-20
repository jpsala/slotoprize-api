
import * as spinService from "./spin.service"


describe('Spin', () => {
  it('getSpin', async () => {
    // const spinService = await spin('borrar1', 1)
    const payTable = await spinService.getPayTable()
    console.log('spin', payTable)
    expect(1).toBe(1)
  })
})
