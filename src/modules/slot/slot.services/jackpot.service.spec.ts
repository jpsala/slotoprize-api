import * as jackpotRepo from "../slot.repo/jackpot.repo"
import { JackpotData } from './../slot.repo/jackpot.repo'
import { getGameUserByDeviceId } from './../../meta/meta-services/meta.service'
import { GameUser } from './../../meta/meta.types'
import * as jackpotService from "./jackpot.service"

describe('There is live data and has spins left', () =>{

  let user: GameUser
  let jackpotLiveRow: JackpotData
  let jackpotRow: JackpotData[]
  const jackpotNextRow: JackpotData =  {
    cycle: 100,
    prize: 10,
    state: "next",
    repeated: 0,
    spinCount: 0,
    confirmed: true
  }
  beforeAll(async () =>{
    user = await getGameUserByDeviceId('borrar1')
    jackpotRow =  [{
      id: 1,
      cycle: 100,
      prize: 10,
      state: "past",
      repeated: 0,
      spinCount: 100,
      confirmed: true
    },{
      id: 1,
      cycle: 100,
      prize: 10,
      state: "live",
      repeated: 0,
      spinCount: 50,
      confirmed: true
    }]
    jackpotLiveRow = jackpotRow[1]
    jest.spyOn(jackpotRepo, 'getJackpotData').mockResolvedValue(jackpotRow)
    jest.spyOn(jackpotRepo, 'getJackpotLiveRow').mockResolvedValue(jackpotLiveRow)
  })

  it('getJackpotLiveRow', async () => {
    const resp = await jackpotService.getJackpotLiveRow()
    expect(resp).toEqual(jackpotLiveRow)
  })
  it('addJackpotNextRow with state next with already a next record, expect an error', async () =>
  {
    const getJackpotNewRowMock = jest.spyOn(jackpotRepo, 'getJackpotNextRow').mockReturnValue(Promise.resolve(jackpotNextRow))
    let error
    try{
      await jackpotService.addJackpotNextRow(jackpotNextRow)
    } catch (_error) {
      error = _error
    }
    expect(getJackpotNewRowMock).toBeCalled()
    expect(error).toBeInstanceOf(Error)
    expect(error).toHaveProperty('message')
    expect(error.message).toEqual('There is already a jackpot cycle with state = \"next\"')
    getJackpotNewRowMock.mockRestore()
  })
  it('addJackpotRow with state next', async () =>
  {
    let addedData
    const getJackpotNewRowMock = jest.spyOn(jackpotRepo, 'getJackpotNextRow').mockReturnValue(Promise.resolve(undefined))
    const addJackpotRowMock = jest.spyOn(jackpotRepo, 'addJackpotNextRow').mockImplementation((data) => {
      return new Promise(resolve =>{ addedData = data;  resolve() })
    })
    await jackpotService.addJackpotNextRow(jackpotNextRow)
    expect(addJackpotRowMock).toBeCalled()
    expect(getJackpotNewRowMock).toBeCalled()
    expect(addedData).toEqual(jackpotNextRow)
    getJackpotNewRowMock.mockRestore()
    addJackpotRowMock.mockRestore()
  })

  it('Add spins to live row, check amount added', async () =>
  {
    const spinsToAdd = 10
    const addSpinsToJackpotLiveRow = jest.spyOn(jackpotRepo, 'addSpinsToJackpotLiveRow')
      .mockImplementation(async () => await Promise.resolve())

    await jackpotService.addSpinsToJackpotLiveRow(spinsToAdd, user)
    expect(addSpinsToJackpotLiveRow).toBeCalledWith(spinsToAdd)

    addSpinsToJackpotLiveRow.mockRestore()
  })

  it('Add spins to live row, check jackpot win', async () =>
  {
    const spinsToAdd = 1000
    const setJackpotWinnedMock = jest.spyOn(jackpotRepo, 'setJackpotWinned').mockImplementation()
    const addSpinsToJackpotLiveRowMock = jest.spyOn(jackpotRepo, 'addSpinsToJackpotLiveRow').mockImplementation((amount) =>
    {
      jackpotLiveRow.spinCount += amount
    })

    await jackpotService.addSpinsToJackpotLiveRow(spinsToAdd, user)

    expect(setJackpotWinnedMock).toBeCalled()
    expect(setJackpotWinnedMock).toBeCalledWith(user, jackpotLiveRow)
    expect(addSpinsToJackpotLiveRowMock).toBeCalled()
    expect(addSpinsToJackpotLiveRowMock).toBeCalledWith(spinsToAdd)

    setJackpotWinnedMock.mockRestore()
    addSpinsToJackpotLiveRowMock.mockRestore()
  })


})