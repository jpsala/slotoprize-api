import { query, queryOne } from "../../../db"
import { reloadRulesFromDb } from "./events/events"

export const getLegalsForCrud = async (): Promise<any> => {

  type Item = {value: string, label: string, localizations: Localization[]}
  type Localization = { languageId: number, languageCode: string, text: string}
  type Language = {id: number, languageCode: string, text: string}

  const languages = <Language[]>(await query(`select * from language`, undefined, true))
  const items: Item[] = []
  const types = [{value:'rules', label: 'Rules'}, {value:'faq', label: 'FAQ'}, {value:'privacyPolicy', label: 'Privacy Policy'}]
  for (const text of types) {
    const item: Item = { value: text.value, label: text.label.toLocaleUpperCase(), localizations: [] }
    for (const language of languages) {
      const localization = <Localization> (await queryOne(`
      select ${language.id} languageId, '${language.languageCode}' languageCode, text
      from localization l where l.item = '${text.value}' and l.language_id = ${language.id}`
      ))
      if(localization) item.localizations.push(localization)
      else item.localizations.push({languageId: language.id, languageCode: language.languageCode, text: ''})
    }
    items.push(item)
  }
  return items
}