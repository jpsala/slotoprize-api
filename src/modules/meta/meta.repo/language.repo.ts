// import createError from 'http-errors'
import {queryMeta} from '../meta.db'
import {LanguageData} from '../meta.types'

export async function getLanguages(fields: string[] | undefined = undefined): Promise<LanguageData[]> {
  const localizationData = await queryMeta(`
    select * from  language
  `, undefined, true, fields)
  return localizationData
}

