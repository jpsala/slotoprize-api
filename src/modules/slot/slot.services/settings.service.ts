import {queryOne, exec} from '../../../db'

export const getSetting = async (key: string, defaultValue: string | number | undefined = undefined): Promise<string> => {
  if (typeof defaultValue === 'number' && isNaN(defaultValue)) throw new Error('SetttingGet defaultValue is NaN')
  const setting = await queryOne(`select value from setting where name = ?`, [key])
  if (setting === undefined && defaultValue !== undefined) {
    console.warn('SettingValue for ', key, 'not found, inserting  a default value of ', defaultValue)
    await exec('insert into setting(name, value) values (?, ?)', [key, defaultValue])
    return defaultValue as string
  }
  if (typeof defaultValue === 'number') setting.value = Number(setting.value)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return setting?.value
}

export const setSetting = async (key: string, value : string | number): Promise<void> => {
  if (typeof (value) === 'number' && isNaN(Number(value))) throw new Error('settingSet value can not be NaN')
  const setting = await queryOne(`select value from setting where name = ?`, [key])
  if (setting) await exec(`update setting set value = '${value}' where name = '${key}'`)
  else await exec(`insert into setting(value, name) values('${value}', '${key}')`)
}

