import { spinRegenerationInit } from '../slot.repo/spin.regeneration.repo'
import { query, queryExec } from './../../../db'
import { WebSocketMessage, wsServer } from './webSocket/ws.service'
type Setting = {id?: number, name: string, value: string, description: string}
let settings: Setting[] = []

export const init = async (): Promise<void> =>
{
  settings = (await query(`select * from setting`)) as Setting[]
}

export const getSetting = async (key: string, defaultValue: string): Promise<string> => {
  const setting = settings.find(_setting => _setting.name.toUpperCase() === key.toUpperCase()) as Setting
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
  //if (setting && setting.value === value) don't do anything
  let oldMaintenanceMode
  if (key.toLocaleLowerCase() === 'maintenancemode') oldMaintenanceMode = setting.value
  if (setting && setting.value !== value) {
    await queryExec(`update setting set value = '${value}' where name = '${key}'`)
    setting.value = value
  } else if (setting === undefined) {
    const respInsert = await queryExec(`insert into setting(value, name) values('${value}', '${key}')`)
    settings.push({ id: respInsert.insertId, name: key, value: value, description: '' })
  }
  if (['lapseForSpinRegeneration', 'maxSpinsForSpinRegeneration', 'spinsAmountForSpinRegeneration'].includes(key)) 
    await spinRegenerationInit()
  if (key.toLocaleLowerCase() === 'maintenancemode' && oldMaintenanceMode !== value) 
    if(value === '1') sendMaintenanceModWsEvent()
  
  
  // if (['lapseForSpinRegeneration', 'maxSpinsForSpinRegeneration', 'spinsAmountForSpinRegeneration'].includes(key)) 
}
const sendMaintenanceModWsEvent = (): void => {
  const wsMessage: WebSocketMessage = {
    code: 200,
    message: 'OK',
    msgType: 'maintenanceMode',
    payload: {
      maintenanceMode: true
    }
  }
  wsServer.send( wsMessage)
}

export const resetSettings = (): void => { settings.splice(0) }
