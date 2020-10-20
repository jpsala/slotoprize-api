// #region imports and types
import { writeFileSync } from 'fs'
import { join } from 'path'
import createHttpError from 'http-errors'
import { BAD_REQUEST } from 'http-status-codes'
import Spritesmith from 'spritesmith'
import pixelsmith from 'pixelsmith'
import { publicPath } from '../../../helpers'
import { getSymbolsAtlas } from '../../slot/slot.services/symbol.service'

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
  textureUrl: string,
  sprites: AtlasSprite[]
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
export async function getAtlas(name: string, padding?: number, quality?: number): Promise<Atlas> {
  if (name.toLocaleLowerCase() === 'symbols') 
    return await getSymbolsAtlas(padding, quality)
  
  throw createHttpError(BAD_REQUEST, `Requested atlas "${name}" not implemented`)
} 

export async function makeAtlas(images: string[], output: string, padding?: number, quality?: number): Promise < Atlas > {
  const finalOutput = join(publicPath(), 'assets', output)
  return await new Promise(done => {
    const options: AtlasOptions = { src: images, exportOpts: {}, engineOpts: {imagemagick: true} }
    if (padding) options.padding = padding
    if (quality) options.exportOpts.quality = quality
    options.exportOpts = {quality: 1}
    options.engineOpts = {quality:1}
    options.quality = 1
    options.engine = pixelsmith
    console.log('options', options)
    Spritesmith.run(options, function handleResult (err, result) {
      // If there was an error, throw it
      if (err) 
        throw err
      
    
      // Output the image
      writeFileSync(finalOutput, result.image)
      const sprites: AtlasSprite[] = []

      for (const entry of Object.entries(result.coordinates))
        sprites.push({
          name: entry[0],
          coordinates: entry[1] as AtlasSpriteCoordinates
        })
      done({
        textureUrl: '',
        sprites,
        properties: result.properties
      })
    })

    // spritesmith.createImages(images, function handleImages(err, images) {
    //   if (err) throw new Error('Error in spritesmith.createImages')

    //   const result = spritesmith.processImages(images)
    //   const writeStream = createWriteStream(finalOutput)
    //   result.image.pipe(writeStream)
    //   const sprites: AtlasSprite[] = []
    //   for (const entry of Object.entries(result.coordinates))
    //     sprites.push({
    //       name: entry[0],
    //       coordinates: entry[1] as AtlasSpriteCoordinates
    //     })
    //   result.image.on('end', () => done({
    //       textureUrl: '',
    //       sprites,
    //       properties: result.properties
    //     })

    //   )
    // })
  })
}