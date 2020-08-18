import { readdirSync, readdir, unlinkSync, writeFileSync, readFileSync } from 'fs'


import { join } from 'path'


import { hostname } from 'os'
import createError from 'http-errors'
import * as statusCodes from 'http-status-codes'
/* eslint-disable no-undef */
/* eslint-disable no-sequences */
/* eslint-disable no-return-assign */
/* eslint-disable id-length */
import { Request, Response, NextFunction } from 'express'
export const toBoolean = (value: string | number | boolean): boolean =>
{
  if (typeof (value) === 'string')
    return ((value.toUpperCase() === 'TRUE') || value.toUpperCase() === '1')
  if (typeof (value) === 'number') return (value === 1)
  if (typeof (value) === 'boolean') return value
  throw createError(statusCodes.BAD_REQUEST, 'Value type not supported')
}
export function pickProps<T>(obj: T, props: string[]): Partial<T>
{
  return props.reduce((a, e) => (a[e] = obj[e], a), {})
}
// eslint-disable-next-line @typescript-eslint/ban-types
export function omitProps(obj: object, props: string[]): any
{
  return props.reduce((r, key) => (delete r[key], r), { ...obj })
}
export const getRandomNumber = (from = 1, to = 100): number => Math.floor((Math.random() * (to)) + from)
export class Fakexpress
{
  res: Partial<Response> = {
    statusCode: 200,
    status: jest.fn().mockImplementation((code) =>
    {
      this.res.statusCode = code
      // this.res.send = message => ({code, message})
      return this.res
    }),
    json: jest.fn().mockImplementation((param) =>
    {
      this.responseData = param
      return this.res
    }),
    cookie: jest.fn(),
    clearCookie: jest.fn()
  };

  req: Partial<Request>;
  next: Partial<NextFunction> = jest.fn();
  responseData: any;
  constructor(req: Partial<Request>)
  {
    this.req = req
    if (!this.req?.headers) this.req.headers = {}
    this.req.headers['dev-request'] = 'true'
  }


}
export function isValidJSON(text: string): boolean
{
  try {
    JSON.parse(text)
    return true
  }
  catch (error) {
    return false
  }
}
export const isNotebook = (): boolean =>
{
  return hostname() === 'jpnote'
}

export const unique = (min = 1, max = 10000000, padLength = 8, padChar = '0'): string => {
  return String(getRandomNumber(min, max)).padStart(padLength, padChar)
}

export function saveFile(
  options: {
    file: { path: string, name: string },
    path?: string,
    fileName?: string,
    id?: string,
    delete?: boolean
  }):
  {
    newPath: string,
    fileName: string,
    url: string
  }
{

  if (!options.file) throw new Error('options.file is required')

  const uniqueName = unique()
  const basePath = `/var/www/html/public/assets/`
  const baseUrl = `/public/assets/`
  const extension = options.file.name.split('.'). pop() || ''
  const url = baseUrl + (options.path ? options.path : 'img')
  const path = basePath + (options.path ? options.path : 'img')
  const fileName = options.fileName ?? `${options.id ? options.id + '_' : ''}${uniqueName}.${extension}`
  const oldPath = options.file.path
  const newPath = join(path, fileName)
  const rawData = readFileSync(oldPath)
  if (options.delete)
    if (!options.id) throw new Error('pass the id if yout want to delete this file')
  const fileNameStartWith = String(options?.id) + '_'
  const files = readdirSync(path)
  files.forEach(file =>
  {
    if (file.startsWith(`${fileNameStartWith}`))
      unlinkSync(join(path, file))
  })

  writeFileSync(newPath, rawData)
  unlinkSync(oldPath)
  const host: string = isNotebook() ? 'http://localhost' : 'http://wopidom.homelinux.com'
  return { newPath, fileName, url: `${host}${url}/${fileName}` }
}
