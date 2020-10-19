import { createWriteStream } from 'fs'
import Spritesmith from 'spritesmith'

export async function makeAtlas(images: string[], output: string)
  : Promise<{
    coordinates: {
      image: string,
      coordinates: { height: number, width: number, x: number, y: number }
    }[],
    properties: { width: number, height: number }
  }> { 

return await new Promise(done => {
  const spritesmith = new Spritesmith() 
  spritesmith.createImages(images, function handleImages (err, images) {
    if(err) throw new console.error('Error in spritesmith.createImages', err)
    
    const result = spritesmith.processImages(images)
    console.log(result.image) // Readable stream outputting image
    console.log(result.coordinates) // Object mapping filename to {x, y, width, height} of image
    console.log(result.properties) // Object with metadata about spritesheet {width, height}
    const writeStream = createWriteStream(output)
    result.image.pipe(writeStream)
      result.image.on('end',()=>done({coordinates: result.coordinates, properties: result.properties}))
    })
  })
}