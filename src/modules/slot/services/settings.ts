import {queryOne, exec} from '../db.slot'

type SettingValue = number | string | boolean
export const settingGet = async (key: string, defaultValue : SettingValue | null | undefined = undefined): Promise<SettingValue> => {
  const setting = await queryOne(`select value from setting where name = ?`, [key])
  if (setting === undefined && defaultValue) {
    console.warn('SettingValue for ', key, 'not found, inserting  a default value of ', defaultValue)
    await exec('insert into setting(name, value) values (?, ?)', [key, defaultValue])
    return defaultValue
  }
  return setting.value
}
