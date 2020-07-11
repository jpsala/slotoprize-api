import {queryOneSlot, execSlot} from '../db.slot'

export const getSetting = async (key: string, defaultValue: string | number | undefined = undefined): Promise<string> => {
  if (typeof defaultValue === 'number' && isNaN(defaultValue)) throw new Error('SetttingGet defaultValue is NaN')
  const setting = await queryOneSlot(`select value from setting where name = ?`, [key])
  if (setting === undefined && defaultValue !== undefined) {
    console.warn('SettingValue for ', key, 'not found, inserting  a default value of ', defaultValue)
    await execSlot('insert into setting(name, value) values (?, ?)', [key, defaultValue])
    return defaultValue as string
  }
  return setting?.value
}

export const setSetting = async (key: string, value : string | number): Promise<void> => {
  if (typeof (value) === 'number' && isNaN(Number(value))) throw new Error('settingSet value can not be NaN')
  const setting = await queryOneSlot(`select value from setting where name = ?`, [key])
  if (setting) await execSlot(`update setting set value = '${value}' where name = '${key}'`)
  else await execSlot(`insert into setting(value, name) values('${value}', '${key}')`)
}

