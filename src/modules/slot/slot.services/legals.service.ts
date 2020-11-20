import { query, queryExec, queryOne, queryScalar } from "../../../db"

type Item = {value: string, label: string, localizations: Localization[]}
type Localization = { languageId: number, languageCode: string, text: string}
type Language = {id: number, languageCode: string, text: string}
export const getLegalsForCrud = async (): Promise<any> => {
  
  
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

export const postLegalsForCrud = async (items: Item[]): Promise<any> => {
  for (const item of items)
    for (const localization of item.localizations) {
      const text = <string>(await queryScalar(`
          select text from localization l
            where l.item = '${item.value}' and l.language_id = ${localization.languageId}`
      ))
      console.log('text', text, `
      select text from localization l
        where l.item = '${item.value}' and l.language_id = ${localization.languageId}`)
      if (text !== undefined)
        await queryExec(`
            update localization set text = ? where language_id = ? and item = ?
          `, [localization.text, localization.languageId, item.value]
        )
      else
        await queryExec(`
            insert into localization(text,language_id,item) values (?, ?, ?)
          `, [localization.text, localization.languageId, item.value]
        )
    }
}