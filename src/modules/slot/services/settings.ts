/* eslint-disable curly */
import {queryOne, exec} from '../db.slot'

type SettingValue = number | string | boolean
export const settingGet = async (key: string, defaultValue : string | undefined = undefined): Promise<SettingValue> => {
  const setting = await queryOne(`select value from setting where name = ?`, [key])
  console.log('setting get defaultValue,  key, value: ', defaultValue, key, setting)
  if (setting === undefined && defaultValue !== undefined) {
    console.warn('SettingValue for ', key, 'not found, inserting  a default value of ', defaultValue)
    await exec('insert into setting(name, value) values (?, ?)', [key, defaultValue])
    return defaultValue as string
  }
  return setting?.value
}
export const settingSet = async (key: string, value : string): Promise<void> => {
  try {
    if (typeof (value) === 'number' && isNaN(Number(value))) throw new Error('settingSet value can not be NaN')
    const setting = await queryOne(`select value from setting where name = ?`, [key])
    if (setting) await exec(`update setting set value = '${value}' where name = '${key}'`)
    else await exec(`insert into setting(value, name) values('${value}', '${key}')`)
  } catch (error) {
    console.log('malll')
    throw error
  }
}
