import Axios from 'axios'
import createHttpError from 'http-errors'
import { BAD_REQUEST } from 'http-status-codes'
import { format } from 'date-fns'
import {queryOne, queryExec, query, queryScalar} from '../../../db'
import { getSetting } from '../../slot/slot.services/settings.service'
import { getLanguage } from '../meta.repo/gameUser.repo'
import { getDefaultLanguage } from '../meta.repo/language.repo'
import { log } from '../../../log'

export interface Localization {
  id: number;
  item: string;
  languageId: string;
  text: string;
}

export const getLocalization = async (item: string, userId?: number, defaultText ?: string): Promise<string> => {
  const defaultLanguage = userId ? await getLanguage(userId) : await getDefaultLanguage()
  const row = await queryOne(`
    select text from localization where language_id = ? and item = ?
  `, [defaultLanguage.id, item]) as { text: string }
  if (!row)
    if (defaultText) {
      await queryExec(`insert into localization(item,language_id,text) values(?, ?, ?)`,
        [item, defaultLanguage.id, defaultText]
      )
      return defaultText
    }
    else {throw createHttpError(BAD_REQUEST, `There is no localization for "${item} in ${defaultLanguage.languageCode}`)}

  return row.text
}
export const getLocalizations = async (item: string): Promise<Localization[]> => {
  const rows = await query(`
    select loc.*, l.language_code from localization loc
      inner join language l on loc.language_id = l.id
    where  item = ?
  `, [item], true) as Localization[]
    return rows
}
export const postLocalizations = async (item: {text: string, id: number, languageId: number}): Promise<any> => {
  const resp = await queryExec(
    `update localization set text = ? where id = ?`,
    [item.text, item.id]
  )
  console.log('resp', resp)
return resp
}
export const updateLocalizationJSON = async (languageCode: string, environment: string): Promise<string> => {
  if(!languageCode || !environment) throw createHttpError(BAD_REQUEST, 'languageCode and environment are required parameters')
  const localizationJsonUrl: string = await getSetting('localizationJsonUrl', 'https://script.google.com/macros/s/AKfycbzkBJBlnS7HfHMj5rlZvAcLTEuoHHBP6848nJ2mfnBzfQ2xge0w/exec?ssid=1zHwpbks-VsttadBy9LRdwQW7E9aDGBc0e80Gw2ALNuQ&sheet=<environment>&langCode=<languageCode>')
  if(!localizationJsonUrl.includes('<languageCode>')) throw createHttpError(BAD_REQUEST, 'Update URL does not contains <languageCode>')
  if(!localizationJsonUrl.includes('<environment>')) throw createHttpError(BAD_REQUEST, 'Update URL does not contains <languageCode>')
  let url = localizationJsonUrl.replace('<languageCode>', languageCode)
  url = url.replace('<environment>', environment)
  log.bright.red('url', url)
  const json = await Axios.get(url)

  if(json && json.data && json.data.msg) throw createHttpError(BAD_REQUEST, json.data.msg)
  const updatedAt: string = format(new Date(), 'yyyy-MM-dd HH:mm:ss')
  await queryExec(`
    update language
      set localization_json = '${escape(JSON.stringify(json.data))}',
          updated_at = '${updatedAt}'
      where language_code = '${languageCode}'
  `)
  return updatedAt
}
export const getLocalizationJSON = async (languageCode: string): Promise<any> => {
  const json = <string> (await queryScalar(`
    select localization_json from language where language_code = '${languageCode}'
  `))
  if(!json) throw createHttpError(BAD_REQUEST, 'There is no localization for ' + languageCode)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return JSON.parse(unescape(json))
}
