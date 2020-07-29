import { query } from './../../../db'

export interface Skin {
    machineSkinTextureUrl: string;
    machineBgColor: string;
}
export const getSkins = async (id?: number): Promise<Skin[]> => {
  const where = id ? ` id = ${id} ` : ' true '
  const rows = await query('select * from skin where ' + where)
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
export const getSkin = async (id: number): Promise<Skin | undefined> => {
  const skins = await getSkins(id)
  if (skins == null || skins.length < 1) return undefined
  return skins[0]
}