import { existsSync, unlinkSync } from 'fs'
import { basename, join } from 'path'
import camelcaseKeys from 'camelcase-keys'
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-return */
// import createError from 'http-errors'
import createHttpError from 'http-errors'
import { BAD_REQUEST } from 'http-status-codes'
import { queryExec, query, queryOne } from '../../../db'
import { getUrlWithoutHost, saveFile, getAssetsUrl } from '../../../helpers'
import { LanguageData } from '../meta.types'
import { getSetting } from '../../slot/slot.services/settings.service'

export const getDefaultLanguage = async (): Promise<LanguageData> => {
    const row = await queryOne(`
        select
            id, language_code as languageCode, texture_url as textureUrl,
            is_default as 'default'
        from language where is_default = 1`) as LanguageData
    if(!row) throw createHttpError(BAD_REQUEST, 'There is no default language')
    return row
  }
export async function getLanguages(): Promise<LanguageData[]> {
    const url = getAssetsUrl()

    const localizationData = await query(
        `
            select id, language_code,
            concat('${url}', texture_url) as texture_url
            from  language where deleted = 0
  `,
        undefined,
        true
    )
    return localizationData
}
export async function toggleDeleteLanguageForCrud(languageId: string): Promise<any> {
    const data = await queryExec(`update language set deleted = if(deleted = 1, 0, 1) where id = ${languageId}`)
    return data.affectedRows
}
export async function deleteLanguageForCrud(languageId: string): Promise<any> {
    let data
    try {
        data = await queryExec(`delete from language where id = ${languageId}`)
    } catch (err) {
        if (err.message.includes('game_user_language_language_code_fk'))
            throw createHttpError(BAD_REQUEST, 'Language can not be deleted, it is assigned to one or more users')
        console.log('err', err)
    }
    return data?.affectedRows
}
export async function getLanguagesForCrud(): Promise<any> {
    const localizationSpreadsheetUrlDev = await getSetting('localizationSpreadsheetUrlDev', 'https://docs.google.com/spreadsheets/d/1zHwpbks-VsttadBy9LRdwQW7E9aDGBc0e80Gw2ALNuQ/edit#gid=1259474418')
    const localizationSpreadsheetUrlLive = await getSetting('localizationSpreadsheetUrlLive', 'https://docs.google.com/spreadsheets/d/1zHwpbks-VsttadBy9LRdwQW7E9aDGBc0e80Gw2ALNuQ/edit#gid=1117868095')
    const localizationJsonUrl = await getSetting('localizationJsonUrl', 'https://script.google.com/macros/s/AKfycbzkBJBlnS7HfHMj5rlZvAcLTEuoHHBP6848nJ2mfnBzfQ2xge0w/exec?ssid=1zHwpbks-VsttadBy9LRdwQW7E9aDGBc0e80Gw2ALNuQ&sheet=<environment>&langCode=<languageCode>')
    const url = getAssetsUrl()
    const data = await query(`
        select id, language_code,
            concat('${url}', texture_url) as texture_url,
            deleted, is_default, date_format(updated_at, '%Y-%m-%d %H:%i') as updated_at
        from  language`,
        undefined,
        true
    )
    return { data, localizationSpreadsheetUrlDev, localizationSpreadsheetUrlLive, localizationJsonUrl }
}
export const postLanguageDefaultForCrud = async (id: number): Promise<void> => {
    await queryExec(`
        update language set is_default = 0 where is_default = 1
    `)
    await queryExec(`
        update language set is_default = 1 where id = ${id}
    `)
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function postLanguageForCrud(fields, files): Promise<any> {
    const isNew = fields.isNew
    const textureFile = files.textureFile
    fields.texture_url = getUrlWithoutHost(fields.texture_url)
    let respQuery

    delete fields.isNew

    if (isNew && !(textureFile || fields.texture_url))
        throw createHttpError(BAD_REQUEST, 'Select an image please')
    

    let languageId

    if (isNew) {
        delete fields.id
        respQuery = await query('insert into language set ?', fields)
        languageId = respQuery.insertId
    } else {
        const { texture_url} = await queryOne(
            `select texture_url from language where id = ${fields.id}`
        )
        const localizationPath = '/var/www/html/public/assets/localization'
        if (texture_url && textureFile) {
            const textureFileToDelete = join(
                localizationPath,
                basename(texture_url)
            )
            if (existsSync(textureFileToDelete)) unlinkSync(textureFileToDelete)
        }

        await query(`update language set ? where id = ${fields.id}`, fields)
        languageId = fields.id
    }

    if (textureFile) {
        const saveResp = saveFile({
            file: textureFile,
            path: 'localization',
            preppend: fields.language_code,
            id: languageId
        })
        await query(`update language set texture_url = ? where id = ?`, [
            saveResp.url,
            languageId
        ])
    }
    const url = getAssetsUrl()
    return camelcaseKeys(
        await queryOne(
            `select
              id, language_code, concat('${url}', texture_url) as texture_url, deleted
            from language where id = ?`,
            [languageId]
        )
    )
}
