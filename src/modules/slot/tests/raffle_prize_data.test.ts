/* eslint-disable no-undef */
// import encodings from '../../../../node_modules/iconv-lite/encodings/';
import {Request, Response, NextFunction} from 'express'

import {rafflesPrizeDataGet} from '../slot.controller'
import {Fakexpress} from "../../../helpers"
import {checkToken} from '../../meta/authMiddleware'

let fakeExpres
xdescribe(`raffle_prize_data`, () => {
  beforeAll(() => {
    fakeExpres = new Fakexpress(
      {
        query: {deviceId: 'borrar1'},
        headers: {"dev-request": 'true'}
      },
    )
  })
  it('gameInitGet resp is an object', async () => {
    try {
      await checkToken(fakeExpres.req as Request, fakeExpres.res as Response, fakeExpres.next as NextFunction)
      try {
        const resp = await rafflesPrizeDataGet(fakeExpres.req as Request, fakeExpres.res as Response)
        expect(resp).toBeInstanceOf(Object)
      } catch (error) {
        fakeExpres.res.statusCode = 500
        console.log('error getting rafflesPrizeDataGet', error.message)
      }
    } catch (error) {
      fakeExpres.res.statusCode = 500
      if (error instanceof Error)
        console.log(error.message, error.name)
      else
      throw error
    }
  })
  it('status is 200', () => {
    expect(fakeExpres.res.statusCode).toBe(200)
  })
})


/*
{
      sessionId: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTExLCJkZXZpY2VJZCI6ImJvcnJhcjEzIiwiaWF0IjoxNTk0NDMyMzE4LCJleHAiOjE1OTQ1MzIzMTh9.piVNwgrxX4R9irf4hid6O-QZvAsyh9QL-FYffDIHUBI',
      requireProfileData: 0,
      languageCode: 'en-US',
      hasPendingPrize: 0,
      profileData: {
        id: 111,
        firstName: '',
        lastName: '',
        email: '',
        deviceName: '',
        deviceModel: '',
        age: null,
        phoneCode: '',
        phoneNumber: '',
        languageCode: 'en-US',
        countryPhoneCode: '',
        isMale: null,
        address: '',
        zipCode: '',
        state: '',
        country: '',
        city: '',
        isNew: false
      },
      languagesData: [
        {
          languageCode: 'en-US',
          textureUrl: 'http://wopidom.homelinux.com/public/assets/localization/english.png',
          localizationUrl: 'http://wopidom.homelinux.com/public/assets/localization/localization_english.json'
        },
        {
          languageCode: 'es',
          textureUrl: 'http://wopidom.homelinux.com/public/assets/localization/spain.png',
          localizationUrl: 'http://wopidom.homelinux.com/public/assets/localization/localization_spanish.json'
        }
      ],
      ticketPrice: 2,
      betPrice: 1,
      maxMultiplier: 3,
      reelsData: [
        { symbolsData: [Array] },
        { symbolsData: [Array] },
        { symbolsData: [Array] }
      ],
      walletData: TextRow { coins: 10, tickets: 10 }
    }
*/


/*
import supertest from 'supertest'
import createApp from "../../../app"
let app
describe(`/api/slot/raffle_prize_data?deviceId=borrar1`, () => {
  beforeAll(async () => {
    app = await createApp()
  })
  let resp; let sessionToken
  it('first get a token', async () => {
    const respGameInit = await supertest(app).get(`/api/slot/game_init?deviceId=borrar1`) as any
    expect(respGameInit.status).toBe(200)
    // 'to have sessionToken prop in the body'
    expect(respGameInit.body).toHaveProperty('sessionId')
    sessionToken = respGameInit.body.sessionId
    // 'sessionToken must be bigger than 100'
    expect(sessionToken?.length).toBeGreaterThan(100)
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
  xdescribe('properties of first element', () => {
    const props = ['closingDate', 'raffleNumberPrice', 'textureUrl', 'itemHighlight', 'name', 'description']
    props.forEach((prop) => {
      it(`element to have prop ${prop}`, () => {
        expect(resp.body[0]).toHaveProperty(prop)
      })
    })
  })
})
*/
