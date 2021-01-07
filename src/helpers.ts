import { readdirSync, unlinkSync, writeFileSync, readFileSync } from 'fs'
import { join } from 'path'
import { hostname } from 'os'
import {StatusCodes} from 'http-status-codes'
import { Request, Response, NextFunction } from 'express'
import createHttpError from 'http-errors'
import { format } from 'date-fns'
import { utc } from 'moment'
import { queryExec, queryOne, queryScalar } from './db'
export const toBoolean = (value: string | number | boolean | undefined): boolean => {
    if(value===undefined) return false
    if (typeof value === 'string')
        return value.toUpperCase() === 'TRUE' || value.toUpperCase() === '1'
    if (typeof value === 'number') return value === 1
    if (typeof value === 'boolean') return value
    throw createHttpError(StatusCodes.BAD_REQUEST, 'Value type not supported ' + typeof value)
}
export const paymentTypesPlural = ['coins', 'spins', 'tickets', 'cards']
export const paymentTypes = ['coin', 'spin', 'ticket', 'card']

export const isValidPaymentType = (paymentType: string): boolean => {
    return paymentTypes.includes(paymentType.toLocaleLowerCase())
}
export const isValidPaymentTypePlural = (paymentType: string): boolean => {
    return paymentTypesPlural.includes(paymentType.toLocaleLowerCase())
}
export function pickProps<T>(obj: T, props: string[]): Partial<T> {
    return props.reduce((a, e) => ((a[e] = obj[e]), a), {})
}
// eslint-disable-next-line @typescript-eslint/ban-types
export function omitProps(obj: object, props: string[]): any {
    return props.reduce((r, key) => (delete r[key], r), { ...obj })
}
export const getRandomNumber = (from = 1, to = 100): number =>
    Math.floor(Math.random() * to + from)
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
    }

    req: Partial<Request>
    next: Partial<NextFunction> = jest.fn()
    responseData: any
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
    } catch (error) {
        return false
    }
}
export const isNotebook = (): boolean => {
    return hostname() === 'jpnote'
}

export const unique = (
    min = 1,
    max = 10000000,
    padLength = 8,
    padChar = '0'
): string => {
    return String(getRandomNumber(min, max)).padStart(padLength, padChar)
}
export const getAssetsPath = ():string => {
    return `/var/www/html/public/assets/`
}
export function saveFile(options: {
    file: { path: string, name: string },
    path?: string,
    fileName?: string,
    id?: string,
    delete?: boolean,
    deleteWithExtension?: boolean,
    preppend?: string
}): {
    newPath: string,
    fileName: string,
    url: string,
    fullUrl: string
} {
    if (!options.file) throw new Error('options.file is required')

    const uniqueName = unique()
    const basePath = getAssetsPath()
    const baseUrl = `/`
    const extension = options.file.name.split('.').pop() || ''
    const url = baseUrl + (options.path ? options.path : 'img')
    const path = basePath + (options.path ? options.path : 'img')
    const preppend = options.preppend ? `_${options.preppend}_` : ''

    const fileName =
        options.fileName ??
        `${
            options.id ? options.id + '_' : ''
        }${preppend}${uniqueName}.${extension}`
    const oldPath = options.file.path
    const newPath = join(path, fileName)
    const rawData = readFileSync(oldPath)
    if (options.delete)
        if (!options.id)
            throw new Error('pass the id if yout want to delete this file')
    if (options.deleteWithExtension)
        if (!options.delete)
            throw new Error(
                'deleteWithExtension parameter needs delete parameter also to be true'
            )
    const fileNameStartWith = String(options?.id) + '_'
    const files = readdirSync(path)
    if (options.delete)
        files.forEach((file) => {
            if (file.startsWith(fileNameStartWith))
                if (
                    !options.deleteWithExtension ||
                    (options.deleteWithExtension && file.endsWith(extension))
                )
                    unlinkSync(join(path, file))
        })

    writeFileSync(newPath, rawData)
    unlinkSync(oldPath)
    return { newPath, fileName, url: `${url}/${fileName}`, fullUrl: `${getAssetsUrl()}${url}/${fileName}` }
}
export const getAssetsUrl = (): string => {
    const _hostname = hostname()

    if (isNotebook()) return 'http://localhost/public/assets'
    else if (_hostname === 'sloto-dev')
        return 'https://assets.dev.slotoprizes.tagadagames.com'
    else if (_hostname === 'slotoprizes')
        return 'https://assets.slotoprizes.tagadagames.com'
    else throw createHttpError(StatusCodes.INTERNAL_SERVER_ERROR, 'hostname unrecognized')
}
export const getAssetsUrls = (): string[] => {
    return ['http://localhost/public/assets',
            'https://assets.dev.slotoprizes.tagadagames.com',
         'https://assets.slotoprizes.tagadagames.com'
]
}
export const sleep = async (time: number): Promise<void> => {
    return await new Promise((resolve) => {
        setTimeout(() => {
            resolve()
        }, time)
    })
}
export const getUrlWithoutHost = (url: string): string => {
    if(!url) return ''
    let retUrl = url
    const assetsUrls= getAssetsUrls()
    for (const assetUrl of assetsUrls)
        // const assetsUrl = getAssetsUrl()
        if (url.startsWith(assetUrl)) retUrl = url.substr(assetUrl.length)
    
    if (!retUrl || retUrl.toLocaleUpperCase() === 'UNDEFINED' || retUrl === '' || retUrl.toUpperCase() === 'NULL') retUrl = ''
    return retUrl
    
}
export const addHostToPath = (path: string): string => {
    if(!path || path.toLocaleUpperCase() === 'UNDEFINED' || path === '' || path.toUpperCase() === 'NULL') return ''
    return getAssetsUrl() + path
}
export const publicPath = (): string => {
    if(isNotebook()) return '/www/public/'
    else if (hostname() === 'sloto-dev')
        return '/var/www/html/public/'
    else if (hostname() === 'slotoprizes')
        return '/var/www/html/public/'
    else throw createHttpError(StatusCodes.INTERNAL_SERVER_ERROR, 'hostname unrecognized')
}
export function shuffleArray(array: any[]): any[] { 
    for (let i = array.length - 1; i > 0; i--) {  
     
        // Generate random number  
        const j = Math.floor(Math.random() * (i + 1)) 
                     
        const temp = array[i] 
        array[i] = array[j] 
        array[j] = temp 
    } 
         
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return array 
  } 

export const checkIfToFastEndpointCall = async ({endPoint, userId, milliseconds = 1000}:
    {endPoint: string, userId: number, milliseconds: number}): Promise<void> => 
{
    const lastCall = await queryOne(`
        select id, last, game_user_id, endpoint from endpoint_last_call 
        where game_user_id = ? and endpoint = ?
    `, [userId, endPoint])
    if(!lastCall){
        await setEndpointLastCall({endPoint, userId})
        return
    }
    
    const lastCallDate = new Date(lastCall.last)
    const nowMoment = utc(new Date())
    const lastMoment = utc(lastCallDate)

    const diff = nowMoment.diff(lastMoment.utc())
    await setEndpointLastCall({endPoint, userId})
    console.log('endpoint %o userId %o mill %o diff %o', endPoint, userId, milliseconds, diff )
    if(diff < milliseconds) throw createHttpError(StatusCodes.BAD_REQUEST, 'Unauthorized call modulation')
    return
}

export const setEndpointLastCall = async ({endPoint, userId}: {endPoint: string, userId: number}): Promise<void> => {
    const lastCallId = await queryScalar(`select id from endpoint_last_call where game_user_id = ? and endpoint = ?`, [userId, endPoint])
    await queryExec(`
        replace into endpoint_last_call set game_user_id = ?, endpoint = ?, last = ?, id = ?
    `, [userId, endPoint, format(new Date(), 'yyyy-MM-dd HH:mm:ss'), lastCallId])
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function deleteProps (obj, prop): any {
    const newObj = obj
    for (const p of prop) 
        (p in obj) && (delete newObj[p])
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return newObj
}

export function validateEmail(mail: string): boolean {
    if (/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(mail))
        return (true)
    return (false)
}