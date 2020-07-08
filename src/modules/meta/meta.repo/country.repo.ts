// import createError from 'http-errors'
import {queryMeta} from '../meta.db'
import {Country, State} from '../meta.types'

export async function getCountries(fields: string[] | undefined = undefined): Promise<Country[] | Partial<Country>> {
  const countries = await queryMeta(`
    select id, name, phone_prefix from  country
  `, undefined, true, fields) as Country[]
  for (const country of countries) {
    const states = await queryMeta(`
      select name from  state
        where country_id = ${country.id}
    `, undefined, true, fields) as State[]
    delete (country as Partial<Country>).id
    country.states = states.map((state) => {
      return {name: state.name} as State
    })
  }
  return countries
}
