import { spinRegenerationInit } from '../slot.repo/spin.regeneration.repo'
import { query, exec } from './../../../db'
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
    const respInsert = (await exec('insert into setting(name, value) values (?, ?)', [key, defaultValue]))
    settings.push({id: respInsert.insertId, name: key, value: defaultValue, description: ''})
    return defaultValue
  }
  return setting ? setting.value : defaultValue
}

export const setSetting = async (key: string, value : string): Promise<void> => {
  const setting = settings.find(_setting => _setting.name === key) as Setting
  //if (setting && setting.value === value) don't do anything
  if (setting && setting.value !== value) {
    await exec(`update setting set value = '${value}' where name = '${key}'`)
    setting.value = value
  } else if (!setting) {
    const respInsert = await exec(`insert into setting(value, name) values('${value}', '${key}')`)
    settings.push({ id: respInsert.insertId, name: key, value: value, description: '' })
  }
  if (['lapseForSpinRegeneration', 'maxSpinsForSpinRegeneration', 'spinsAmountForSpinRegeneration'].includes(key)) 
    await spinRegenerationInit()
}

export const resetSettings = (): void => { settings.splice(0) }

// export const getSetting = async (key: string, defaultValue: string | number | undefined = undefined): Promise<string> => {
//   if (typeof defaultValue === 'number' && isNaN(defaultValue)) throw new Error('SetttingGet defaultValue is NaN')
//   const setting = await queryOne(`select value from setting where name = ?`, [key])
//   if (setting === undefined && defaultValue !== undefined) {
//     console.warn('SettingValue for ', key, 'not found, inserting  a default value of ', defaultValue)
//     await exec('insert into setting(name, value) values (?, ?)', [key, defaultValue])
//     return defaultValue as string
//   }
//   if (typeof defaultValue === 'number') setting.value = Number(setting.value)
//   // eslint-disable-next-line @typescript-eslint/no-unsafe-return
//   return setting?.value
// }

// export const setSetting = async (key: string, value : string | number): Promise<void> => {
//   if (typeof (value) === 'number' && isNaN(Number(value))) throw new Error('settingSet value can not be NaN')
//   const setting = await queryOne(`select value from setting where name = ?`, [key])
//   if (setting) await exec(`update setting set value = '${value}' where name = '${key}'`)
//   else await exec(`insert into setting(value, name) values('${value}', '${key}')`)
// }