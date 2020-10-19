import { createWriteStream } from 'fs'
import Spritesmith from 'spritesmith'

export type AtlasSpriteCoordinates = {
  height: number, width: number, x: number, y: number
}
export type AtlasSprite = {
  name: string,
  coordinates: AtlasSpriteCoordinates
}
export type Atlas = {
  textureUrl: string,
  sprites: AtlasSprite[]
  properties: { width: number, height: number }
}

export async function makeAtlas(images: string[], output: string): Promise<Atlas> { 

return await new Promise(done => {
  const spritesmith = new Spritesmith() 
  spritesmith.createImages(images, function handleImages (err, images) {
    if(err) throw new console.error('Error in spritesmith.createImages', err)
    
    const result = spritesmith.processImages(images)
    const writeStream = createWriteStream(output)
    result.image.pipe(writeStream)
    const sprites: AtlasSprite[] = []
    for (const entry of Object.entries(result.coordinates))
      sprites.push({
        name: entry[0],
        coordinates: entry[1] as AtlasSpriteCoordinates
      })
    
    result.image.on('end', () => done({
        textureUrl: output,
        sprites,
        properties: result.properties
      }))
    })
  })
}