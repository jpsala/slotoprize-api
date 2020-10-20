/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { readdirSync, readFileSync, readdir, unlinkSync, writeFileSync, existsSync } from "fs"
import path, { basename, join } from 'path'
import toCamelCase from 'camelcase-keys'

import createError, { InternalServerError } from 'http-errors'
import createHttpError from "http-errors"
import { INTERNAL_SERVER_ERROR } from "http-status-codes"
import { query, exec } from '../../../db'
import { Atlas, makeAtlas } from "../../meta/meta-services/atlas"
import { urlBase , getRandomNumber, addHostToPath, getUrlWithoutHost, publicPath } from './../../../helpers'

export type SymbolDTO = {id: number, payment_type: string, texture_url: string, symbolName: string}

const assetsPath = join(publicPath(), 'assets/')
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
    const url = urlBase()
    const symbolsRows = await query(
      'SELECT * FROM symbol s WHERE s.id IN (SELECT s.id FROM pay_table pt WHERE pt.symbol_id = s.id)'
    )
    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    symbolsRows.forEach((symbol) => { symbol.texture_url = url + symbol.texture_url})
    const reels: any[] = []
    for (let reel = 1; reel < 4; reel++)
      reels[reel] = symbolsRows

    return { reels, symbols: symbolsRows }
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
    console.log('symbolDto', symbolDto)
    resp = await exec(`update symbol set ? where id = ${symbolDto.id}`, <any>symbolDto)
    symbolId = symbolDto.id

  }
  const file = saveFileAndGetFileUrl(files.image, symbolId)

  symbolDto.texture_url = file ?? getUrlWithoutHost(symbolDto.texture_url)
  console.log('symbolDto.texture_url', symbolDto.texture_url)

  if (isNew)
    symbolDto.id = symbolId
    await exec(`update symbol set ?  where id = ${symbolDto.id}`, <any>symbolDto)
    symbolDto.texture_url = addHostToPath(symbolDto.texture_url)

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
    writeFileSync(newPath, rawData)
    unlinkSync(oldPath)
    return `/symbols/live/${fileName}`
  }
  function removeActualImage(file: any, eventId: number): void
  {
    if (!file) return undefined
    const eventImgPath = `/var/www/html/public/assets/symbols/live`
    const fileNameStartWith = `${eventId}_`
    readdir(eventImgPath, (err, files) => {
      files.forEach(file => {
        if (file.startsWith(`${fileNameStartWith}`))
          unlinkSync(path.join(eventImgPath, file))
      })
    })
  }
}
export const getSymbolsAtlas = async (padding?: number, quality?: number): Promise<Atlas> => {

  const symbols:{image: string, name: string}[] = await query(`
    select distinct s.texture_url as image, symbol_name as name
    from pay_table pt
        inner join symbol s on pt.symbol_id = s.id`
  )
  if(!symbols || symbols.length < 1) throw createHttpError(INTERNAL_SERVER_ERROR, 'There are no symbols in DBs')
  const sprites: string[] = []
  symbols.forEach(_symbol => {
    console.log('assetsPath', assetsPath)
    const file = `${assetsPath}${_symbol.image}`
    if(existsSync(file))
    sprites.push(file)
  })
  const atlas = await makeAtlas(sprites, '/atlas/symbolsAtlas.png', padding, quality)
  
  let symbolIdx = 0
  for (const symbol of atlas.sprites) {
    const symbolInDB = symbols.find(_symbol =>
      basename(_symbol.image) === basename(atlas.sprites[symbolIdx].name as string)
    )
    if(!symbolInDB) throw createHttpError(INTERNAL_SERVER_ERROR, 'Symbol not found')
    atlas.sprites[symbolIdx]['symbolName'] = symbolInDB.name
    atlas.sprites[symbolIdx]['coordinates'] = symbol.coordinates
    delete atlas.sprites[symbolIdx].name
    symbolIdx++
  }
  atlas.textureUrl = `${urlBase()}/atlas/symbolsAtlas.png`
  return atlas
}

export const deleteSymbol = async (id: string): Promise<any> =>
{
  const symbols = await query(
    `delete from symbol where id = ${id}`
  )
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return symbols
}
export const getSymbols = async (): Promise<any> =>
{
  const url = urlBase()
  const symbols = await query(
    `SELECT id, concat('${url}', texture_url) as texture_url, payment_type, symbol_name from symbol`
  )
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return symbols
}
