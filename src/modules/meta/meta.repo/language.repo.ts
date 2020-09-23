import { unlinkSync, existsSync } from 'fs'
import { basename, join } from 'path'
import { BAD_REQUEST } from 'http-status-codes'
import camelcaseKeys from 'camelcase-keys'

/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-return */
// import createError from 'http-errors'
import createHttpError from 'http-errors'
import {query, queryOne, exec} from '../../../db'
import {LanguageData} from '../meta.types'
import { saveFile , urlBase } from '../../../helpers'


export async function getLanguages(): Promise<LanguageData[]> {
 const url = urlBase()

  const localizationData = await query(`
    select id, language_code,
      concat('${url}', texture_url) as texture_url,
      concat('${url}', localization_url) as localization_url
    from  language
  `, undefined, true)
  return localizationData
}

export async function deleteLanguageForCrud(languageId: string): Promise<any> {
  const data = await exec(`delete from language where id = ${languageId}`)
  return data.affectedRows
}
export async function getLanguagesForCrud(): Promise<any>
{
 const url = urlBase()

  const data = await query(`
    select id, language_code,
    concat('${url}', texture_url) as texture_url,
    concat('${url}', localization_url) as localization_url
     from  language
  `, undefined, true)
  return data
}
export async function postLanguageForCrud(fields, files): Promise<any>
{
  const isNew = fields.isNew
  const localizationFile = files.localizationFile
  const textureFile = files.textureFile
  let respQuery

  delete fields.isNew

  if (isNew && !(localizationFile || fields.localization_url)) throw createHttpError(BAD_REQUEST, 'Select a JSON file please')
  if (isNew && !(textureFile || fields.texture_url)) throw createHttpError(BAD_REQUEST, 'Select an image please')

  let languageId

  if (isNew){
    delete fields.id
    respQuery = await query('insert into language set ?', fields)
    languageId =  respQuery.insertId
  } else {

    const { texture_url, localization_url } = await queryOne(`select texture_url, localization_url from language where id = ${fields.id}`)

    const localizationPath = '/var/www/html/public/assets/localization'

    if (texture_url && textureFile) {
      const textureFileToDelete = join(localizationPath, basename(texture_url))
      if (existsSync(textureFileToDelete)) unlinkSync(textureFileToDelete)
    }
    if (localization_url && localizationFile) {
      const localizationFileToDelete = join(localizationPath, basename(localization_url))
      if (existsSync(localizationFileToDelete)) unlinkSync(localizationFileToDelete)
    }

    await query(`update language set ? where id = ${fields.id}`, fields)
    languageId =  fields.id
  }

  if (localizationFile) {
    const saveResp = saveFile(
      {
        file: localizationFile,
        path: 'localization',
        preppend: fields.language_code,
        id: languageId
      })
      await query(`update language set localization_url = ? where id = ?`, [
        saveResp.url, languageId
      ])
  }
  if (textureFile) {
    const saveResp = saveFile(
      {
        file: textureFile,
        path: 'localization',
        preppend: fields.language_code,
        id: languageId
      })
      await query(`update language set texture_url = ? where id = ?`, [
        saveResp.url, languageId
      ])
  }
  return camelcaseKeys(await queryOne('select * from language where id = ?', [languageId]))
}

