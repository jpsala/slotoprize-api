/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { readdirSync, readFileSync, readdir, unlinkSync, writeFileSync, existsSync } from "fs"
import path, { join } from 'path'
import toCamelCase from 'camelcase-keys'
import createHttpError from "http-errors"
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "http-status-codes"
import { query, queryExec } from '../../../db'
import { Atlas, buildAtlas } from "../../meta/meta-services/atlas"
import { getAssetsUrl , getRandomNumber, addHostToPath, getUrlWithoutHost, publicPath } from './../../../helpers'

export type SymbolDTO = {id: number, payment_type: string, texture_url: string, symbolName: string}

const assetsPath = join(publicPath(), 'assets/')
export const getReelsData = async (): Promise<any> =>
{
  try {
    const symbolsData = await query(`
      SELECT s.id, s.payment_type, s.symbol_name 
        FROM symbol s 
        WHERE s.id IN (SELECT s.id FROM pay_table pt WHERE pt.symbol_id = s.id)
        order by reel_order
    `)
    const reels: any[] = []
    for (let reel = 1; reel < 4; reel++)
      reels.push({ symbolsData: toCamelCase(symbolsData) })
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return reels
  } catch (error) {
    throw createHttpError(INTERNAL_SERVER_ERROR, error)
  }
}
export const symbolsInFS = (): string[] =>
{
  const rawFiles = readdirSync('/var/www/html/public/assets/symbols/live')
  const url = getAssetsUrl()
  const imgFiles = rawFiles
    .map(imgFile => `${url}/${imgFile}`)
  return imgFiles
}
export const symbolsInDB = async (): Promise<any> =>
{
  try {
    const url = getAssetsUrl()
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
type SymbolDto = { id: number, payment_type: string, texture_url: string, reel_order: number }
export const setSymbol = async (symbolDto: SymbolDto, files: { image?: any }): Promise<any> =>
{
  symbolDto.reel_order = ['card', 'spin', 'jackpot', 'ticket'].includes(symbolDto.payment_type) ? 1 : 0
  let isNew = false
  if (String(symbolDto.id) === '-1') {
    isNew = true
    delete (symbolDto as any).id
  }
  let resp
  let symbolId

  if (isNew) {
    resp = await queryExec(`insert into symbol set ?`, <any>symbolDto)
    symbolId = resp.insertId
    removeActualImage(files?.image, symbolId)
  }
  else {
    console.log('symbolDto', symbolDto)
    resp = await queryExec(`update symbol set ? where id = ${symbolDto.id}`, <any>symbolDto)
    symbolId = symbolDto.id

  }
  const file = saveFileAndGetFileUrl(files.image, symbolId)

  symbolDto.texture_url = file ?? getUrlWithoutHost(symbolDto.texture_url)
  console.log('symbolDto.texture_url', symbolDto.texture_url)

  if (isNew)
    symbolDto.id = symbolId
    await queryExec(`update symbol set ?  where id = ${symbolDto.id}`, <any>symbolDto)
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
export async function deleteSymbolsAtlas(): Promise<void> {
  await queryExec('delete from atlas where name = "symbols"')
}
export const buildSymbolsAtlas = async (padding?: number, quality?: number): Promise<Atlas> => {

  const symbols:{image: string, id: string}[] = await query(`
    select distinct s.id, s.texture_url as image
    from pay_table pt
        inner join symbol s on pt.symbol_id = s.id`
  )
  if(!symbols || symbols.length < 1) throw createHttpError(INTERNAL_SERVER_ERROR, 'There are no symbols in DBs')

  const spritesData: {id: string, image: string}[] = []
  symbols.forEach(_symbol => {
    const file = `${assetsPath}${_symbol.image}`
    if(!existsSync(file)) throw createHttpError(BAD_REQUEST, `buildSymbolsAtlas: ${file} does not exists`)
    spritesData.push({image: file, id:_symbol.id})
  })

  const atlas = await buildAtlas(spritesData, 'symbols', padding, quality)
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
  const url = getAssetsUrl()
  const symbols = await query(
    `SELECT id, concat('${url}', texture_url) as texture_url, payment_type, symbol_name from symbol`
  )
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return symbols
}
