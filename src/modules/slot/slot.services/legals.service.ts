import camelcaseKeys from "camelcase-keys"
import createHttpError from "http-errors"
import { BAD_REQUEST } from "http-status-codes"
import { query, queryExec, queryOne, queryScalar } from "../../../db"
import { getGameUserByDeviceId } from "../../meta/meta.repo/gameUser.repo"

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
export const getLegals = async (deviceId: string): Promise<any> => {
  const user = camelcaseKeys(await getGameUserByDeviceId(deviceId)) 
  if (!user) throw createHttpError(BAD_REQUEST, 'User not found')
  const items:string[] = []
  const types = ['rules', 'faq', 'privacyPolicy']
  for (const text of types) {
    const localization = <string> (await queryScalar(`
    select text
      from localization l
        inner join language la on la.id = l.language_id
      where l.item = '${text}' and la.language_code = '${user.languageCode}'`
    ))
    if(localization) items.push(localization)
    else items.push('')
  }
  return {rulesTxt: items[0], faqTxt: items[1], privacyPolicyTxt: items[2]}
}

export const postLegalsForCrud = async (items: Item[], dontEnforce: boolean): Promise<number> => {
  const enforce = !dontEnforce
  let resetAgreementsFromProfiles = false
  
  for (const item of items)
    for (const localization of item.localizations) {
      const row = <{ id: number, text: string }> (await queryOne(`
          select id, text from localization l
            where l.item = '${item.value}' and l.language_id = ${localization.languageId}`
      ))
      if (row !== undefined) {
        if (enforce && row.text !== localization.text) 
          resetAgreementsFromProfiles = true
        
    
        await queryExec(`
            update localization set text = ? where language_id = ? and item = ?
          `, [localization.text, localization.languageId, item.value]
        )
      }
      else
        {await queryExec(`
            insert into localization(text,language_id,item) values (?, ?, ?)
          `, [localization.text, localization.languageId, item.value]
        )}
    }
  let agreementsReseted = 0
  if (resetAgreementsFromProfiles) {
    const resp = await queryExec('update game_user set agreements = 0 where agreements = 1')
    agreementsReseted = resp.affectedRows
    console.log(`${agreementsReseted} resetAgreementsFromProfiles`)
  }
  return agreementsReseted
}