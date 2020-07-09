/* eslint-disable no-undef */
import supertest from 'supertest'
import chai, {expect} from 'chai'
import createApp from "../../../app"


chai.config.showDiff = true
chai.config.includeStack = false
const app = createApp()

describe(`/api/slot/raffle_prize_data?deviceId=borrar1`, () => {
  let resp; let sessionToken
  it('first get a token', async () => {
    const respGameInit = await supertest(app).get(`/api/slot/game_init?deviceId=borrar1`) as any
    expect(respGameInit.status).to.equal(200)
    expect(respGameInit.body, 'to have sessionToken prop in the body').to.have.property('sessionId')
    sessionToken = respGameInit.body.sessionId
    expect(sessionToken?.length, 'sessionToken must be bigger than 100').to.gt(100)
    resp = await supertest(app).get(`/api/slot/raffle_prize_data?deviceId=borrar1&sessionToken=${sessionToken}`) as any
  })
  // it('status === 200 ', () => {
  //   expect(resp.status).to.equal(200)
  // })
  // it('response is an array', () => {
  //   expect(resp.body).to.be.an('array')
  // })
  // it('response to have at least 1 element', () => {
  //   expect(resp.body).to.have.length.greaterThan(0)
  // })
  describe('properties of first element', () => {
    const props = ['closingDate', 'raffleNumberPrice', 'textureUrl', 'itemHighlight', 'name', 'description']
    props.forEach((prop) => {
      it(`element to have prop ${prop}`, () => {
        expect(resp.body[0]).to.have.property(prop)
      })
    })
  })
})

