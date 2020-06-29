// import createError from 'http-errors'
import {queryOne, query} from '../meta.db'
import { LanguageData } from '../meta.types'
export async function getLanguage(userId: number): Promise<LanguageData> {
  const localizationData = await queryOne(`
    select l.* from game_user gu
      inner join language l on l.language_code = gu.language_code
    where gu.id = ${userId}
  `, undefined, true)
  return localizationData
}

