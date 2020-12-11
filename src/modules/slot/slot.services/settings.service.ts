import { getLocalization } from '../../meta/meta-services/localization.service'
import { spinRegenerationInit } from '../slot.repo/spin.regeneration.repo'
import { query, queryExec } from './../../../db'
import { ExtWebSocket, WebSocketMessage, wsServer } from './webSocket/ws.service'
type Setting = {id?: number, name: string, value: string, description: string}
let settings: Setting[] = []

export const init = async (): Promise<void> =>
{
  settings = (await query(`select * from setting`)) as Setting[]
}

export const getSetting = async (key: string, defaultValue: string): Promise<string> => {
  const setting = settings.find(_setting => _setting.name.toUpperCase() === key.toUpperCase()) as Setting
  // const setting = settings[key] as Setting
  if (setting === undefined && defaultValue !== undefined) {
    console.warn('SettingValue for ', key, 'not found, inserting  a default value of ', defaultValue)
    const respInsert = (await queryExec('insert into setting(name, value) values (?, ?)', [key, defaultValue]))
    settings.push({id: respInsert.insertId, name: key, value: defaultValue, description: ''})
    return defaultValue
  }
  return setting ? setting.value : defaultValue
}

export const setSetting = async (key: string, value : string): Promise<void> => {

  const setting = settings.find(_setting => _setting.name === key) as Setting

  const isSettingForManenanceMode = key.toLocaleLowerCase() === 'maintenancemode'
  const oldMaintenanceMode = isSettingForManenanceMode ? setting.value : undefined
  const runSpinRegenerationInit = ['lapseForSpinRegeneration', 'maxSpinsForSpinRegeneration', 'spinsAmountForSpinRegeneration'].includes(key)

  if (setting && setting.value !== value) {
    await queryExec(`update setting set value = '${value}' where name = '${key}'`)
    console.log('setting, update setting', key, value)
    setting.value = value
  } else if (setting === undefined) {
    const respInsert = await queryExec(`insert into setting(value, name) values('${value}', '${key}')`)
    settings.push({ id: respInsert.insertId, name: key, value: value, description: '' })
    console.log('setting, insert setting', key, value)
  }
  
  if (runSpinRegenerationInit) await spinRegenerationInit()

  if (isSettingForManenanceMode && oldMaintenanceMode !== value && value === '1') {
    console.log('setting, sendMaintenanceModWsEvent()')
    await sendMaintenanceModWsEvent()
  }
  
  
  // if (['lapseForSpinRegeneration', 'maxSpinsForSpinRegeneration', 'spinsAmountForSpinRegeneration'].includes(key)) 
}
const sendMaintenanceModWsEvent = async (): Promise<void> => {
  const wsMessage: WebSocketMessage = {
    code: 200,
    message: 'OK',
    msgType: 'maintenanceMode',
    payload: {
      maintenanceMode: true,
    }
  }
  for (const client of wsServer.server.clients) {
    const userId = Number((client as ExtWebSocket).user.id)
    wsMessage.payload.message = await getLocalization('maintenanceMode', userId, 'We are in maintenance, we\'ll be back up soon!')
    
    const payload = JSON.stringify(wsMessage.payload)
    
    const msgStr = Object.assign({}, wsMessage) as any
    msgStr.payload = payload
    const msg = JSON.stringify(wsMessage.isJson ? wsMessage : msgStr)
    client.send(msg)
    console.log('sendMaintenanceModWsEvent, sended to ', (client as ExtWebSocket).user.id, (client as ExtWebSocket).user.deviceId)
  }
    
  
  // wsServer.server.clients.forEach((client) => {
  //   const userId = Number((client as ExtWebSocket).user.id)
  //   wsMessage.payload.message = await getLocalization('maintenanceMode', userId, 'We are in maintenance, we\'ll be back up soon!')

  //   client.send(wsMessage)
  // })
}

export const resetSettings = (): void => { settings.splice(0) }
