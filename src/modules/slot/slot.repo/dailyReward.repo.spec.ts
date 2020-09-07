import moment from 'moment'
import { Wallet } from './../../meta/models/wallet'
import { GameUser } from './../../meta/meta.types'
/* eslint-disable @typescript-eslint/no-unused-vars */
import { getLastSpinDays } from './../slot.services/gameInit/dailyReward.spin'
import { getGameUserByDeviceId } from './../../meta/meta-services/meta.service'
import * as dailyRepo from "./dailyReward.repo"
import { getWalletByDeviceId } from './wallet.repo'
import * as db from './../../../db'
const dailyRepoOrig = jest.requireActual('./dailyReward.repo')
const dbOrig = jest.requireActual('./../../../db')
const yesterday = new Date(moment().subtract(1, 'days').format())
const today = new Date(moment().subtract(0, 'days').format())
describe('dailyReward - 0 days, lastClaim yesterday', () =>
{
  let user: GameUser
  beforeAll(async () =>{
    user = await getGameUserByDeviceId('borrar1')
    jest.spyOn(dailyRepo, 'getDailyRewardPrizes').mockImplementation(() => {
      return Promise.resolve([
        { type: 'coin', amount: 1 },
        { type: 'ticket', amount: 2 },
        { type: 'spin', amount: 3 }
      ])
    })
    jest.spyOn(dailyRepo, 'getLastSpin').mockImplementation(async (user) => {
      return await Promise.resolve({
        days: 0,
        last: new Date('2020-09-04'),
        lastClaim: yesterday
      }) as dailyRepo.SpinData
    })
  })
  it('Days = 0', async () => {
    const days = await getLastSpinDays(user)
    expect(days).toEqual(0)
  })
  it('coins in wallet updated', async () => {
    const walletAnt = await getWalletByDeviceId('borrar1')
    await dailyRepo.dailyRewardClaim('borrar1')
    const walletAfter = await getWalletByDeviceId('borrar1')
    expect(walletAfter.coins - walletAnt.coins).toEqual(1)
  })
  it('claimed = false', async () =>
  {
    const dailyRewardClaimed = await dailyRepo.isDailyRewardClaimed('borrar1')
    expect(dailyRewardClaimed).toEqual(false)
  })
  it('prize has to be { type: \'coin\', amount: 2 }', async () =>
  {
    const userPrize = await dailyRepo.getUserPrize(user)
    expect(userPrize).toEqual({ type: 'coin', amount: 1 })
  })
  it('wallet.coins in db is updated with wallet.coins + 1', async () =>
  {
    const wallet = await getWalletByDeviceId('borrar1')
    let walletTicketsUpdated
    const mock = jest.spyOn(db, 'exec').mockImplementation((...args) =>
    {
      const query = args[0]
      const params = args[1]
      if (query.startsWith('update wallet set coins')) walletTicketsUpdated = params[0]
    })
    const dailyRewardResp = (await dailyRepo.dailyRewardClaim('borrar1')) as Wallet
    mock.mockRestore()
    expect(dailyRewardResp.coins).toEqual(walletTicketsUpdated)
  })
  it('dailyReward returned coins eq wallet.coins + 1', async () =>
  {
    const wallet = await getWalletByDeviceId('borrar1')
    const dailyRewardResp = (await dailyRepo.dailyRewardClaim('borrar1')) as Wallet
    const walletAfter = await getWalletByDeviceId('borrar1')
    expect( wallet.coins + 1).toEqual(dailyRewardResp.coins)
  })
})
describe('dailyReward - 1 days, lastClaim yesterday', () =>
{
  let user: GameUser
  beforeAll(async () =>{
    user = await getGameUserByDeviceId('borrar1')
    jest.spyOn(dailyRepo, 'getDailyRewardPrizes').mockImplementation(() => {
      return Promise.resolve([
        { type: 'coin', amount: 1 },
        { type: 'ticket', amount: 2 },
        { type: 'spin', amount: 3 }
      ])
    })
    jest.spyOn(dailyRepo, 'getLastSpin').mockImplementation(async (user) => {
      return await Promise.resolve({
        days: 1,
        last: new Date('2020-09-04'),
        lastClaim: yesterday
      }) as dailyRepo.SpinData
    })
  })
  it('Days = 1', async () => {
    const days = await getLastSpinDays(user)
    expect(days).toEqual(1)
  })
  it('tickets in wallet updated', async () => {
    const walletAnt = await getWalletByDeviceId('borrar1')
    await dailyRepo.dailyRewardClaim('borrar1')
    const walletAfter = await getWalletByDeviceId('borrar1')
    expect(walletAfter.tickets - walletAnt.tickets).toEqual(2)
  })
  it('claimed = false', async () =>
  {
    const dailyRewardClaimed = await dailyRepo.isDailyRewardClaimed('borrar1')
    expect(dailyRewardClaimed).toEqual(false)
  })
  it('prize has to be { type: \'ticket\', amount: 2 }', async () =>
  {
    const userPrize = await dailyRepo.getUserPrize(user)
    expect(userPrize).toEqual({ type: 'ticket', amount: 2 })
  })
  it('wallet.tickets in db is updated with wallet.tickets + 1', async () =>
  {
    const wallet = await getWalletByDeviceId('borrar1')
    let walletTicketsUpdated
    const mock = jest.spyOn(db, 'exec').mockImplementation((...args) =>
    {
      const query = args[0]
      const params = args[1]
      if (query.startsWith('update wallet set tickets')) walletTicketsUpdated = params[0]
    })
    const dailyRewardResp = (await dailyRepo.dailyRewardClaim('borrar1')) as Wallet
    mock.mockRestore()
    expect(dailyRewardResp.tickets).toEqual(walletTicketsUpdated)
  })
  it('dailyReward returned coins eq wallet.tickets + 2', async () =>
  {
    const wallet = await getWalletByDeviceId('borrar1')
    const dailyRewardResp = (await dailyRepo.dailyRewardClaim('borrar1')) as Wallet
    const walletAfter = await getWalletByDeviceId('borrar1')
    expect( wallet.tickets + 2).toEqual(dailyRewardResp.tickets)
  })
})
describe('dailyReward - 2 days, lastClaim yesterday', () =>
{
  let user: GameUser
  beforeAll(async () =>{
    user = await getGameUserByDeviceId('borrar1')
    jest.spyOn(dailyRepo, 'getDailyRewardPrizes').mockImplementation(() => {
      return Promise.resolve([
        { type: 'coin', amount: 1 },
        { type: 'ticket', amount: 2 },
        { type: 'spin', amount: 3 }
      ])
    })
    jest.spyOn(dailyRepo, 'getLastSpin').mockImplementation(async (user) => {
      return await Promise.resolve({
        days: 2,
        last: new Date('2020-09-04'),
        lastClaim: yesterday
      }) as dailyRepo.SpinData
    })
  })
  it('Days = 2', async () => {
    const days = await getLastSpinDays(user)
    expect(days).toEqual(2)
  })
  it('spins in wallet updated', async () => {
    const walletAnt = await getWalletByDeviceId('borrar1')
    await dailyRepo.dailyRewardClaim('borrar1')
    const walletAfter = await getWalletByDeviceId('borrar1')
    expect(walletAfter.spins - walletAnt.spins).toEqual(3)
  })
  it('claimed = false', async () =>
  {
    const dailyRewardClaimed = await dailyRepo.isDailyRewardClaimed('borrar1')
    expect(dailyRewardClaimed).toEqual(false)
  })
  it('prize has to be { type: \'spin\', amount: 3 }', async () =>
  {
    const userPrize = await dailyRepo.getUserPrize(user)
    expect(userPrize).toEqual({ type: 'spin', amount: 3 })
  })
  it('wallet.spins in db is updated with wallet.spins + 3', async () =>
  {
    const wallet = await getWalletByDeviceId('borrar1')
    let walletSpinsUpdated
    const mock = jest.spyOn(db, 'exec').mockImplementation((...args) =>
    {
      const query = args[0]
      const params = args[1]
      if (query.startsWith('update wallet set spins')) walletSpinsUpdated = params[0]
    })
    const dailyRewardResp = (await dailyRepo.dailyRewardClaim('borrar1')) as Wallet
    mock.mockRestore()
    expect(dailyRewardResp.spins).toEqual(walletSpinsUpdated)
  })
  it('dailyReward returned spins eq wallet.spins + 3', async () =>
  {
    const wallet = await getWalletByDeviceId('borrar1')
    const dailyRewardResp = (await dailyRepo.dailyRewardClaim('borrar1')) as Wallet
    const walletAfter = await getWalletByDeviceId('borrar1')
    expect( wallet.spins + 3).toEqual(dailyRewardResp.spins)
  })
})
