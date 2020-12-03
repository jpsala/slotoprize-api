// #region imports and types
import { writeFileSync } from 'fs'
import { basename, extname, join } from 'path'
import createHttpError from 'http-errors'
import { StatusCodes } from 'http-status-codes'
import Spritesmith from 'spritesmith'
import pixelsmith from 'pixelsmith'
import { getAssetsUrl, publicPath } from '../../../helpers'
import { buildSymbolsAtlas } from '../../slot/slot.services/symbol.service'
import { queryOne, queryExec } from '../../../db'
import { log } from '../../../log'

export type AtlasSpriteCoordinates = {
  height: number,
  width: number,
  x: number,
  y: number
}
export type AtlasSprite = {
  name?: string,
  symbolName?: string,
  coordinates: AtlasSpriteCoordinates
}
export type Atlas = {
  name: string,
  textureUrl: string,
  spritesData: AtlasSprite[]
  padding: number,
  properties: {
    width: number,
    height: number
  }
}
type AtlasOptions = {
  src: string[],
  padding?: number,
  exportOpts: { quality?: number },
  engineOpts: {
    imagemagick?: boolean,
    quality?: number
  },
  engine?: 'canvassmith' | 'gmsmith'
}
// #endregion

export async function buildAtlas(
  images: string[] | {name:string,image:string}[], name: string, padding?: number, quality?: number):
   Promise < Atlas > 
{
  const finalOutput = join(publicPath(), 'assets', `atlas/${name}.png`)
  const atlas: Atlas = await new Promise(done => {
    const _images: string[] = []
    for (const image of images) 
      if(typeof image === 'string') _images.push(image) 
      else _images.push(image.image)
    
    const options: AtlasOptions = {
      src: _images,
      exportOpts: {},
      engineOpts: { imagemagick: true },
      engine: pixelsmith
    }
    if (padding) options.padding = padding
    if (quality) {
      options.exportOpts.quality = quality
      options.engineOpts.quality = quality
    }
  try {
        Spritesmith.run(options, function handleResult (err, result) {
          // If there was an error, throw it
          console.log('error in run', err)
          if (err) 
            return
    
          // Output the image
          writeFileSync(finalOutput, result.image)
          
          const spritesData: AtlasSprite[] = []
          let entryIdx = 0
          for (const entry of Object.entries(result.coordinates)) {
            const extension = extname(basename(entry[0]))
            let name = basename(basename(entry[0]), extension)
            const imageObjOrString = images[entryIdx++]
            if(typeof(imageObjOrString) !== 'string') name = imageObjOrString.name
            spritesData.push({ name, coordinates: entry[1] as AtlasSpriteCoordinates })
          }
          done(
            {
              name,
              textureUrl: `/atlas/${name}.png`,
              padding: padding ?? 0,
              spritesData,
              properties: result.properties,
            }
          )
        })
  } catch (err) {
    console.warn('Error building atlas', name)
    log.error(err)
    throw createHttpError(StatusCodes.BAD_REQUEST, 'Error building atlas', name)
  }
  })
  await saveAtlasToDB(atlas)
  console.log('buildAtlas generated and saved to fs and db', atlas)
  return atlas
}

export async function deleteAtlas(name: string): Promise<void> {
  const resp = await queryExec(`delete from atlas where name = ?`, [name])
  console.log('deleteAtlas response', name, resp)
}
export async function saveAtlasToDB(data: Atlas): Promise<void> {
  const atlasInDB = await queryOne(`select id from atlas where name = '${data.name}'`)
  const jsonData = JSON.stringify(data)
  if (atlasInDB)
    await queryExec(`update atlas set json = ? where name = ? `, [jsonData, data.name])
  else
    await queryExec(`insert into atlas(name, json) values(?, ?) `, [data.name, jsonData])
}
export async function getAtlas(name: string, images?: string[] | {name:string,image:string}[], rebuild = false): Promise<Atlas> {
  const atlasInDB = await queryOne(`select id, json from atlas where name = '${name}'`)
  let jsonData: Atlas | undefined = undefined
  if (atlasInDB) {
    {jsonData = JSON.parse(atlasInDB.json) as Atlas}
    if(rebuild && images) {
      const atlas = await buildAtlas(images, name)
      return atlas
    }
  } else if (name.toLocaleLowerCase() === 'symbols') 
    {jsonData = await buildSymbolsAtlas()}
  else if(images){
     const atlas = await buildAtlas(images, name)
     return atlas
  }
  
  if (jsonData && name.toLocaleLowerCase() === 'symbols') jsonData.textureUrl = getAssetsUrl() + jsonData.textureUrl
  
  if(!jsonData)throw createHttpError(StatusCodes.BAD_REQUEST, `Requested atlas "${name}" not implemented`)
  return jsonData
}