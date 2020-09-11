/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { readdirSync, readFileSync, readdir, unlinkSync, writeFileSync } from "fs"
import path from 'path'
import toCamelCase from 'camelcase-keys'

import createError from 'http-errors'
import { query as slotQuery, exec } from '../../../db'

import { isNotebook, getRandomNumber } from './../../../helpers'

export const getReelsData = async (): Promise<any> =>
{
  try {
    const symbolsData = await slotQuery('SELECT s.texture_url, s.payment_type, s.symbol_name FROM symbol s WHERE s.id IN (SELECT s.id FROM pay_table pt WHERE pt.symbol_id = s.id)')
    const reels: any[] = []
    for (let reel = 1; reel < 4; reel++)
      reels.push({ symbolsData: toCamelCase(symbolsData) })
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return reels
  } catch (error) {
    throw createError(createError.InternalServerError, error)
  }
}
export const symbolsInFS = (): string[] =>
{
  const rawFiles = readdirSync('/var/www/html/public/assets/symbols/live')
  const url = isNotebook() ? 'http://localhost/public/assets/symbols/live' : 'http://wopidom.homelinux.com/public/assets/symbols/live'
  const imgFiles = rawFiles
    .filter(filename => (/\.(gif|jpe?g|tiff?|png|webp|bmp)$/i).test(filename))
    .map(imgFile => `${url}/${imgFile}`)
  return imgFiles
}
export const symbolsInDB = async (): Promise<any> =>
{
  try {
    const SymbolsRows = await slotQuery(
      'SELECT * FROM symbol s WHERE s.id IN (SELECT s.id FROM pay_table pt WHERE pt.symbol_id = s.id)'
    )
    const reels: any[] = []
    for (let reel = 1; reel < 4; reel++)
      reels[reel] = SymbolsRows

    return { reels, symbols: SymbolsRows }
  } catch (error) {
    return { status: 'error' }
  }
}
type SymbolDto = { id: number, payment_type: string, texture_url: string }
export const setSymbol = async (symbolDto: SymbolDto, files: { image?: any }): Promise<any> =>
{
  let isNew = false
  if (String(symbolDto.id) === '-1') {
    isNew = true
    delete symbolDto.id
  }
  let resp
  let symbolId

  if (isNew) {
    resp = await exec(`insert into symbol set ?`, <any>symbolDto)
    symbolId = resp.insertId
    removeActualImage(files?.image, symbolId)
  }
  else {
    resp = await exec(`update symbol set ? where id = ${symbolDto.id}`, <any>symbolDto)
    symbolId = symbolDto.id

  }

  const file = saveFileAndGetFilePath(files.image, symbolId)

  symbolDto.texture_url = file ?? symbolDto.texture_url
  console.log('symbolDto.texture_url', symbolDto.texture_url)

  if (isNew)
    symbolDto.id = symbolId

  await exec(`update symbol set ?  where id = ${symbolDto.id}`, <any>symbolDto)

  return toCamelCase(symbolDto)


  function saveFileAndGetFilePath(file: any, id: number): string | undefined
  {
    if (!file) return undefined
    const rand = getRandomNumber(111, 10000)
    const eventImgPath = `/var/www/html/public/assets/symbols/live`
    const fileName = `${id}_${rand}.${file.name.split('.').pop()}`
    const oldPath = file.path
    const newPath = path.join(eventImgPath, fileName)
    const rawData = readFileSync(oldPath)
    console.log('newPath, rawData', newPath, rawData)
    writeFileSync(newPath, rawData)
    unlinkSync(oldPath)
    const url = isNotebook() ? 'http://localhost' : 'http://wopidom.homelinux.com'
    return `${url}/public/assets/symbols/live/${fileName}`
  }
  function removeActualImage(file: any, eventId: number): void
  {
    if (!file) return undefined
    const eventImgPath = `/var/www/html/public/assets/symbols/live`
    const fileNameStartWith = `${eventId}_`
    readdir(eventImgPath, (err, files) =>
    {
      files.forEach(file =>
      {
        if (file.startsWith(`${fileNameStartWith}`))
          unlinkSync(path.join(eventImgPath, file))
      })
    })
  }
}
export const deleteSymbol = async (id: string): Promise<any> =>
{
  const symbols = await slotQuery(
    `delete from symbol where id = ${id}`
  )
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return symbols
}
export const getSymbols = async (): Promise<any> =>
{
  const symbols = await slotQuery(
    'SELECT * FROM symbol'
  )
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return symbols
}
