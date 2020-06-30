/* eslint-disable guard-for-in */
/* eslint-disable require-atomic-updates */
// import createError from 'http-errors'
import {query} from '../meta.db'
import {Country, State} from '../meta.types'

export async function getCountries(fields: string[] | undefined = undefined): Promise<Country[]> {
  const countries = await query(`
    select * from  country
  `, undefined, true, fields) as Country[]
  for (const country of countries) {
    const states = await query(`
      select * from  state
      where country_id = ${country.id}
    `, undefined, true, fields) as State[]
    country.states = states
  }
  return countries
}

