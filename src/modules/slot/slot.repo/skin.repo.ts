// import createError from 'http-errors'
import { query } from './../../../db'

export interface Skin {
  machineSkinTextureUrl: string;
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
}
/*
public Color cameraColor;
        public Color headerColor;
        public Color bodyColor;
        public Color btnColor;
        public Color scrollBGColor;
        public Color scrollHandleColor;
        public Color darkTXTColor;
        public Color imgColor1;
        public Color imgColor2;
        public Color imgColor3;
        public Color spriteRenderColor;
*/
export const getSkins = async (id?: number): Promise<Skin[]> => {
  const where = id ? ` id = ${id} ` : ' true '
  const rows = await query('select * from skin where ' + where)
  const skins: Skin[] = []
  for (const row of rows) {
    const skin: Skin = {
      machineSkinTextureUrl: row.machineSkinTextureUrl,
      cameraColor: row.cameraColor,
      headerColor: row.headerColor,
      bodyColor: row.bodyColor,
      btnColor: row.btnColor,
      scrollBGColor: row.scrollBGColor,
      scrollHandleColor: row.scrollHandleColor,
      darkTXTColor: row.darkTXTColor,
      imgColor1: row.imgColor1,
      imgColor2: row.imgColor2,
      imgColor3: row.imgColor3,
      spriteRenderColor: row.spriteRenderColor
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