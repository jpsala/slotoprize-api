import createError from 'http-errors'
import statusCodes from 'http-status-codes'
/* eslint-disable no-undef */
/* eslint-disable no-sequences */
/* eslint-disable no-return-assign */
/* eslint-disable id-length */
import { Request, Response, NextFunction } from 'express'
export const toBoolean = (value: string | number | boolean): boolean => {
  if (typeof (value) === 'string')
    return ((value.toUpperCase() === 'TRUE') || value.toUpperCase() === '1')
  if (typeof (value) === 'number') return (value === 1)
  if (typeof (value) === 'boolean') return value
  throw createError(statusCodes.BAD_REQUEST, 'Value type not supported')
}
export function pickProps<T>(obj: T, props: string[]): Partial<T> {
  return props.reduce((a, e) => (a[e] = obj[e], a), {})
}
// eslint-disable-next-line @typescript-eslint/ban-types
export function omitProps(obj: object, props: string[]): any {
  return props.reduce((r, key) => (delete r[key], r), { ...obj })
}
export const getRandomNumber = (from = 1, to = 100): number => Math.floor((Math.random() * (to)) + from)
export class Fakexpress {
  res: Partial<Response> = {
    statusCode: 200,
    status: jest.fn().mockImplementation((code) => {
      this.res.statusCode = code
      // this.res.send = message => ({code, message})
      return this.res
    }),
    json: jest.fn().mockImplementation((param) => {
      this.responseData = param
      return this.res
    }),
    cookie: jest.fn(),
    clearCookie: jest.fn()
  };

  req: Partial<Request>;
  next: Partial<NextFunction> = jest.fn();
  responseData: any;
  constructor(req: Partial<Request>) {
    this.req = req
    if (!this.req?.headers) this.req.headers = {}
    this.req.headers['dev-request'] = 'true'
  }


}
export function isValidJSON(text: string): boolean {
  try {
    JSON.parse(text)
    return true
  }
  catch (error) {
    return false
  }
}
