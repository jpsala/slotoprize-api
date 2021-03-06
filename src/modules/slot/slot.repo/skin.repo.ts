// #region imports
import createError from 'http-errors'
import { BAD_REQUEST } from 'http-status-codes'
import camelcaseKeys from 'camelcase-keys'
import { getUrlWithoutHost, saveFile, getAssetsUrl } from '../../../helpers'
import { query, queryOne, queryExec } from './../../../db'

// #endregion
export interface Skin {
    machineSkinTextureUrl: string;
    machineBgColor: string;
}
export const getSkins = async (id?: number): Promise<Skin[]> => {
    const url = getAssetsUrl()
    const where = id ? ` id = ${id} ` : ' true '
    const rows = await query(
        `select id, concat('${url}', machineSkinTextureUrl) as machineSkinTextureUrl, machineBgColor, name from skin where ` +
            where
    )
    const skins: Skin[] = []
    for (const row of rows) {
        const skin: Skin = {
            machineSkinTextureUrl: row.machineSkinTextureUrl,
            machineBgColor: row.machineBgColor
        }
        skins.push(skin)
    }
    return skins
}
export const getSkinsForCrud = async (): Promise<any> => {
    const url = getAssetsUrl()
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await query(
        `select id, concat('${url}', machineSkinTextureUrl) as machineSkinTextureUrl, machineBgColor, name from skin`
    )
}
export const getSkin = async (id: number): Promise<Skin | undefined> => {
    const skins = await getSkins(id)
    if (skins == null || skins.length < 1) return undefined
    return skins[0]
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function postSkinForCrud(fields, files): Promise<any> {
    const isNew = fields.isNew
    const file = files.file ?? files.file
    fields.machineSkinTextureUrl = getUrlWithoutHost(fields.machineSkinTextureUrl)
    let skinId
    delete fields.isNew
    // if (isNew && !file && !fields.machineSkinTextureUrl)
    //     throw createError(BAD_REQUEST, 'Select an image please')
    if ((!file && !fields.machineSkinTextureUrl) && !fields.machineBgColor)
        throw createError(BAD_REQUEST, 'Select an image and/or a Color please')
    
    if (!fields.name)
        throw createError(BAD_REQUEST, 'Name is required')
    if (!fields.machineBgColor) fields.machineBgColor = ''  
    if (isNew) {
        delete fields.id
        const respQuery = await queryExec('insert into skin set ?', fields)
        skinId = respQuery.insertId
    } else {
        skinId = fields.id
        await query(`update skin set ? where id = ${skinId as number}`, fields)
    }

    if (file) {
        const saveResp = saveFile({
            file,
            path: 'skins',
            id: skinId,
            delete: true
        })
        await query(`update skin set machineSkinTextureUrl = ? where id = ?`, [
            saveResp.url,
            skinId
        ])
    }
    const url = getAssetsUrl()

    const respSkin = await queryOne(`
    select id, concat('${url}', machineSkinTextureUrl) as machineSkinTextureUrl, machineBgColor, name
    from skin where id = ${skinId as number}
  `)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return camelcaseKeys(respSkin)
}
export async function deleteSkinForCrud(skinId: string): Promise<any> {
    const data = await queryExec(`delete from skin where id = ${skinId}`)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return data.affectedRows
}
