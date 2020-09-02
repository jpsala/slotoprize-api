import { BAD_REQUEST } from 'http-status-codes'
import camelcaseKeys from 'camelcase-keys'

/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-return */
// import createError from 'http-errors'
import createHttpError from 'http-errors'
import {query, queryOne, exec} from '../../../db'
import {LanguageData} from '../meta.types'
import { saveFile } from '../../../helpers'

export async function getLanguages(): Promise<LanguageData[]> {
  const localizationData = await query(`
    select * from  language
  `, undefined, true)
  return localizationData
}

export async function deleteLanguageForCrud(languageId): Promise<any> {
  const data = await exec(`delete from language where id = ${languageId}`)
  return data.affectedRows
}
export async function getLanguagesForCrud(): Promise<any> {
  const data = await query(`
    select * from  language
  `, undefined, true)
  return data
}
export async function postLanguageForCrud(fields, files): Promise<any>
{
  const isNew = fields.isNew !== 'undefined'
  const file = files.file ?? files.file
  let respQuery
  delete fields.isNew
  if (isNew && (!file && (!fields.localizationUrl || fields.localizationUrl === 'undefined')))
  throw createHttpError(BAD_REQUEST, 'Select a JSON file please')
  if(isNew) respQuery = await query('insert into language set ?', fields)
  else respQuery = await query(`update language set ? where id = ${fields.id}`, fields)

  const languageId = isNew ? respQuery.insertId : fields.id
  if (isNew) delete fields.id

  if (file) {
    const saveResp = saveFile({ file, path: 'localization', preppend:fields.language_code, id: languageId, delete: true })
    await query(`update language set localization_url = ? where id = ?`, [
      saveResp.url, languageId
    ])
  }
  return camelcaseKeys(await queryOne('select * from language where id = ?', [languageId]))
}

