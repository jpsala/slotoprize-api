/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { readdirSync, readFileSync, readdir, unlinkSync, writeFileSync } from "fs"
import path from 'path'
import toCamelCase from 'camelcase-keys'

import createError from 'http-errors'
import { query, exec } from '../../../db'
import { urlBase , getRandomNumber } from './../../../helpers'

export type SymbolDTO = {id: number, payment_type: string, texture_url: string, symbolName: string}


export const getReelsData = async (): Promise<any> =>
{
  try {
    const url = urlBase()
    const symbolsData = await query(`SELECT concat('${url}',s.texture_url) as texture_url, s.payment_type, s.symbol_name FROM symbol s WHERE s.id IN (SELECT s.id FROM pay_table pt WHERE pt.symbol_id = s.id)`)
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
  const url = urlBase()
  const imgFiles = rawFiles
    .map(imgFile => `${url}/${imgFile}`)
  return imgFiles
}
export const symbolsInDB = async (): Promise<any> =>
{
  try {
<<<<<<< HEAD
    const SymbolsRows =(
=======
    const SymbolsRows = await query(
>>>>>>> 95573a4... changing for dev, dynamic urls
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
    delete (symbolDto as any).id
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

  const file = saveFileAndGetFileUrl(files.image, symbolId)

  symbolDto.texture_url = file ?? symbolDto.texture_url
  console.log('symbolDto.texture_url', symbolDto.texture_url)

  if (isNew)
    symbolDto.id = symbolId

  await exec(`update symbol set ?  where id = ${symbolDto.id}`, <any>symbolDto)

  return toCamelCase(symbolDto)


  function saveFileAndGetFileUrl(file: any, id: number): string | undefined
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
    return `/public/assets/symbols/live/${fileName}`
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
      })
    })
  }
}
export const deleteSymbol = async (id: string): Promise<any> =>
{
<<<<<<< HEAD
  const symbols =(
=======
  const symbols = await query(
    `delete from symbol where id = ${id}`
>>>>>>> 95573a4... changing for dev, dynamic urls
  )
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return symbols
}
export const getSymbols = async (): Promise<any> =>
{
<<<<<<< HEAD
  const symbols =(
    'SELECT * FROM symbol'
=======
  const url = urlBase()
  const symbols = await query(
    `SELECT id, concat('${url}', texture_url) as texture_url, payment_type, symbol_name from symbol`
>>>>>>> 95573a4... changing for dev, dynamic urls
  )
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return symbols
}
