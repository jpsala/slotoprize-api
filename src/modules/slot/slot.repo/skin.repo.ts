// import createError from 'http-errors'
import { query } from './../../../db'

export interface Skin {
  cameraColor: string;
  headerColor: string;
  bodyColor: string;
  btnColor: string;
  scrollBGColor: string;
  scrollHandleColor: string;
  darkTXTColor: string;
  imgColor1: string;
  imgColor2: string;
  imgColor3: string;
  spriteRenderColor: string;
  machineSkinTextureUrl: string;
}

export const getSkins = async (id?: number): Promise<Skin[]> => {
  const where = id ? ` id = ${id} ` : ' true '
  const skins: Skin[] = await query('select * from skin where ' + where)
  return skins
}
export const getSkin = async (id: number): Promise<Skin | undefined> => {
  const skins = await getSkins(id)
  if (skins == null || skins.length < 1) return undefined
  return skins[0]
}