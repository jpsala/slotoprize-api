import createError from 'http-errors'
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { BAD_REQUEST } from 'http-status-codes'
import camelcaseKeys from 'camelcase-keys'
import { saveFile } from '../../../helpers'
import { query, queryOne } from './../../../db'
export interface Skin
{
  machineSkinTextureUrl: string;
  machineBgColor: string;
}
export const getSkins = async (id?: number): Promise<Skin[]> =>
{
  const where = id ? ` id = ${id} ` : ' true '
  const rows = await query('select * from skin where ' + where)
  const skins: Skin[] = []
  for (const row of rows)
  {
    const skin: Skin = {
      machineSkinTextureUrl: row.machineSkinTextureUrl,
      machineBgColor: row.machineBgColor
    }
    skins.push(skin)
  }
  return skins
}
export const getSkinsForCrud = async (): Promise<any> =>
{
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return await query('select * from skin')
}
export const getSkin = async (id: number): Promise<Skin | undefined> =>
{
  const skins = await getSkins(id)
  if (skins == null || skins.length < 1) return undefined
  return skins[0]
}
export async function postSkinForCrud(fields, files): Promise<any>
{
  console.log('fields', fields)
  const isNew = fields.isNew
  console.log('isNew', isNew)
  const file = files.file ?? files.file
  let respQuery
  delete fields.isNew
  if (isNew && (!file && (!fields.machineSkinTextureUrl))) throw createError(BAD_REQUEST, 'Select an image please')
  if(!fields.machineBgColor) throw createError(BAD_REQUEST, 'Background color is required')
  if(!fields.name) throw createError(BAD_REQUEST, 'Name is required')
  if(isNew) respQuery = await query('insert into skin set ?', fields)
  else respQuery = await query(`update skin set ? where id = ${fields.id}`, fields)

  const skinId = isNew ? respQuery.insertId : fields.id
  if (isNew) delete fields.id

  if (file) {
    const saveResp = saveFile({ file, path: 'skins', id: skinId, delete: true })
    await query(`update skin set machineSkinTextureUrl = ? where id = ?`, [
      saveResp.url, skinId
    ])
  }
  const respSkin = await queryOne(`
    select * from skin where id = ${skinId}
  `)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return camelcaseKeys(respSkin)
}