import createHttpError from 'http-errors'
import { BAD_REQUEST } from 'http-status-codes'
import {queryOne, queryExec, query} from '../../../db'
import { getLanguage } from '../meta.repo/gameUser.repo'
import { getDefaultLanguage } from '../meta.repo/language.repo'

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
