import { readdirSync, unlinkSync, writeFileSync, readFileSync } from 'fs'

import { join } from 'path'

import { hostname } from 'os'
import * as statusCodes from 'http-status-codes'
/* eslint-disable no-undef */
/* eslint-disable no-sequences */
/* eslint-disable no-return-assign */
/* eslint-disable id-length */
import { Request, Response, NextFunction } from 'express'
import createHttpError from 'http-errors'
import { INTERNAL_SERVER_ERROR } from 'http-status-codes'
export const toBoolean = (value: string | number | boolean): boolean => {
    if (typeof value === 'string')
        return value.toUpperCase() === 'TRUE' || value.toUpperCase() === '1'
    if (typeof value === 'number') return value === 1
    if (typeof value === 'boolean') return value
    throw createHttpError(statusCodes.BAD_REQUEST, 'Value type not supported')
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
    url: string
} {
    if (!options.file) throw new Error('options.file is required')

    const uniqueName = unique()
    const basePath = `/var/www/html/public/assets/`
    const baseUrl = `/public/assets/`
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
    return { newPath, fileName, url: `${url}/${fileName}` }
}
export const urlBase = (): string => {
    const _hostname = hostname()
    console.log('hostname', _hostname)
    if (isNotebook()) return 'http://localhost'
    else if (_hostname === 'sloto-dev')
        return 'https://assets.dev.slotoprizes.tagadagames.com'
    else if (_hostname === 'slotoprizes')
        return 'https://assets.slotoprizes.tagadagames.com'
    else throw createHttpError(INTERNAL_SERVER_ERROR, 'hostname unrecognized')
}
export const sleep = async (time: number): Promise<void> => {
    return await new Promise((resolve) => {
        setTimeout(() => {
            resolve()
        }, time)
    })
}
