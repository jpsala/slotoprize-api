import createError from 'http-errors'
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { BAD_REQUEST } from 'http-status-codes'
import camelcaseKeys from 'camelcase-keys'
// import createError from 'http-errors'
import {Country, State} from '../meta.types'
import { saveFile , getAssetsUrl } from '../../../helpers'

import { queryOne, query } from './../../../db'

export async function getCountries(): Promise<Country[] | Partial<Country>> {
  const countries = await query(`
    select id, name, phone_prefix from  country
  `, undefined, true) as Country[]
  for (const country of countries) {
    const states = await query(`
      select name from  state
        where country_id = ${country.id}
    `, undefined, true) as State[]
    delete (country as Partial<Country>).id
    country.states = states.map((state) => {
      return {name: state.name} as State
    })
  }
  return countries
}
export async function getCountriesForCrud(): Promise<any>
{
  const url = getAssetsUrl()
  const countries = await query(`
    select id, name, phone_prefix, language_id, currency,
      concat('${url}', texture_url) as texture_url,
      l.language_code from country c
      left join language l on c.language_id = l.id
  `)
  const languages = await query(`
    select id, language_code,
      concat('${url}', texture_url) as texture_url
    from  language
  `)
  const data = {countries: camelcaseKeys(countries), languages:camelcaseKeys(languages)}
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return data
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function postCountryForCrud(fields, files): Promise<any>
{
  const isNew = fields.isNew
  console.log('isNew', isNew)
  const file = files.file ?? files.file
  let respQuery
  delete fields.isNew
  if (isNew && (!file && (!fields.textureUrl))) throw createError(BAD_REQUEST, 'Select an image please')
  if(!fields.currency) throw createError(BAD_REQUEST, 'Currency is required')
  if(!fields.language_id) throw createError(BAD_REQUEST, 'Language is required')
  if(!fields.phone_prefix) throw createError(BAD_REQUEST, 'Phone prefix is required')
  if(isNew) respQuery = await query('insert into country set ?', fields)
  else respQuery = await query(`update country set ? where id = ${fields.id}`, fields)

  const countryId = isNew ? respQuery.insertId : fields.id
  if (isNew) delete fields.id

  if (file) {
    const saveResp = saveFile({ file, path: 'localization', id: countryId, delete: true })
    await query(`update country set texture_url = ? where id = ?`, [
      saveResp.url, countryId
    ])
  }
  const respCountry = await queryOne(`
    select c.*, l.language_code from country c
        left join language l on c.language_id = l.id where c.id = ${countryId}
  `)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return camelcaseKeys(respCountry)
}