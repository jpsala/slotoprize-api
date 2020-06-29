// import createError from 'http-errors'
import {queryOne, query} from '../meta.db'
import { LanguageData } from '../meta.types'
export async function getLanguages(): Promise<LanguageData[]> {
  const localizationData = await query(`
    select * from  language
  `, undefined, true)
  return localizationData
}

