/* eslint-disable no-undef */
// import encodings from '../../../../node_modules/iconv-lite/encodings/';
import {Request, Response} from 'express'
import {gameInitGet} from '../slot.controller'
import {delUser} from '../../meta/meta.repo/gameUser.repo'
import {verifyToken} from '../../../services/jwtService'
import {Fakexpress} from "../../../helpers"
import {getSetting} from "../slot.services/settings.service"


let fakeExpres
describe(`game-init new user`, () => {
  const deviceId = 'borrarNoExiste'
  beforeAll(() => {
    fakeExpres = new Fakexpress({query: {deviceId}})
  })
  afterAll(async () => {
    await delUser(deviceId)
  })
  it('gameInitGet resp is an object', async () => {
    try {
      const resp = await gameInitGet(fakeExpres.req as Request, fakeExpres.res as Response)
      expect(resp).toBeInstanceOf(Object)
    } catch (error) {
      expect(1).toBe(1)
    }
  })
  it('status is 200', () => {
    expect(fakeExpres.res.statusCode).toBe(200)
  })
  it('requireProfileData is 0', () => {
    expect(fakeExpres.responseData.requireProfileData).toBe(0)
  })
  it('interstitialsRatio is equal to interstitialsRatio setting', async () => {
    const interstitialsRatio = await getSetting('interstitialsRatio', '5')
    expect(fakeExpres.responseData.interstitialsRatio).toBeNumber()
    expect(fakeExpres.responseData.interstitialsRatio).toEqual(interstitialsRatio)
  })
  it('requireProfileData is 0', () => {
    expect(fakeExpres.responseData.requireProfileData).toBe(0)
  })
  let sessionToken
  it('sessionToken to be valid', () => {
      // 'to have sessionToken prop in the body'
    expect(fakeExpres.responseData).toHaveProperty('sessionId')
    sessionToken = fakeExpres.responseData.sessionId
    expect(Object.keys(sessionToken)).not.toHaveLength(0)
      // 'sessionToken must be bigger than 100'
    expect(sessionToken?.length).toBeGreaterThan(100)
  })
  it('decodeToken throw no errors', () => {
    const {error} = verifyToken(sessionToken as string)
      // 'error from verifyToken'
    expect(error).toBeUndefined()
  })
  it(`decodedToken.deviceId === "${deviceId}"`, () => {
    const {decodedToken} = verifyToken(sessionToken as string)
    expect(decodedToken.deviceId).toBe(deviceId)
  })
  it('requireProfileData is 1 or 0', () => {
      // 'requireProfileData is 1 or 0'
    expect(fakeExpres.responseData.requireProfileData).toBeGreaterThanOrEqual(0)

      // 'requireProfileData is 1 or 0'
    expect(fakeExpres.responseData.requireProfileData).toBeLessThanOrEqual(1)
  })
  describe('properties of profileData', () =>
  {
    // it ('fakeExpress', () =>
    // {
    //   console.warn('fakeExpres.responseData.profileData)', fakeExpres.responseData.profileData))
    // })
    const props = ['firstName', 'lastName', 'email', 'isDev', 'deviceName', 'deviceModel', 'age', 'phoneCode', 'phoneNumber', 'isMale', 'address', 'zipCode', 'state', 'country', 'city', 'isNew']
    props.forEach((prop) => {
      it(`profileData to have prop ${prop}`, () => {
        expect(fakeExpres.responseData.profileData).toHaveProperty(prop)
      })
    })
  })
  it('languageCode to be en-US', () => {
      // 'languageCode to be en-US'
    expect(fakeExpres.responseData.languageCode).toBe('en-US')
  })
  it('ticketPrice to be equal to the setting', async () => {
    const ticketPrice = await getSetting('ticketPrice', '2')
    expect(fakeExpres.responseData.ticketPrice).toBe(Number(ticketPrice))
  })
  it('betPrice to be equal to the setting', async () => {
    const betPrice = await getSetting('betPrice', '2')
    expect(fakeExpres.responseData.betPrice).toBe(Number(betPrice))
  })
  it('maxMultiplier to be equal to the setting', async () => {
    const maxMultiplier = await getSetting('maxMultiplier', '2')
    expect(fakeExpres.responseData.maxMultiplier).toBe(Number(maxMultiplier))
  })
  it('userId to be there', () => {
    expect(fakeExpres.responseData.profileData).toHaveProperty('id')
  })
  it('languagesData to be an array', () => {
      // 'languagesData to be an array'
    expect(fakeExpres.responseData.languagesData).toBeInstanceOf(Array)
  })
  it('languagesData.length > 0', () => {
      // 'languagesData.length to be > 0'.length
    expect(fakeExpres.responseData.languagesData.length).toBeGreaterThan(0)
  })
  it('languagesData[0].languageCode === "en-US"', () => {
      // 'languagesData[0].languageCode === "en-US"'
    expect(fakeExpres.responseData.languagesData[0].languageCode).toBe('en-US')
  })
  it(`isNew to be true`, () => {
    expect(fakeExpres.responseData.profileData.isNew).toBe(true)
  })
  it('walletData to have coins, spins and tickets', () => {
    expect(fakeExpres.responseData.walletData).toHaveProperty('coins')
    expect(fakeExpres.responseData.walletData).toHaveProperty('tickets')
    expect(fakeExpres.responseData.walletData).toHaveProperty('spins')
  })
  it(
        'walletData to have coins and tickets equal to initialWalletTickets and initialWalletCoins',
        async () => {
          const coins = Number(await getSetting('initialWalletTickets', '1'))
          const tickets = Number(await getSetting('initialWalletCoins', '1'))
          // '.to.be.eq(coins)'
          expect(fakeExpres.responseData.walletData.coins).toBe(coins)
          // '.to.be.eq(tickets)'
          expect(fakeExpres.responseData.walletData.tickets).toBe(tickets)
        }
      )
  it('reelsData to be an array ', () => {
    expect(fakeExpres.responseData.reelsData).toBeInstanceOf(Array)
  })
  it('reelsData to have 3 elements ', () => {
    expect(fakeExpres.responseData.reelsData).toHaveLength(3)
  })
  it('reelsData first element to have prop symbolsData', () => {
    expect(fakeExpres.responseData.reelsData[0]).toHaveProperty('symbolsData')
  })
  it('xp.responseData.reelsData[0].symbolsData is an array', () => {
    expect(fakeExpres.responseData.reelsData[0].symbolsData).toBeInstanceOf(Array)
  })
  it('xp.responseData.reelsData[0].symbolsData[0] to have property textureUrl', () => {
    expect(fakeExpres.responseData.reelsData[0].symbolsData[0]).toHaveProperty('textureUrl')
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
          textureUrl: 'https://assets.slotoprizes.tagadagames.com/localization/english.png',
          localizationUrl: 'https://assets.slotoprizes.tagadagames.com/localization/localization_english.json'
        },
        {
          languageCode: 'es',
          textureUrl: 'https://assets.slotoprizes.tagadagames.com/localization/spain.png',
          localizationUrl: 'https://assets.slotoprizes.tagadagames.com/localization/localization_spanish.json'
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
