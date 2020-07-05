/* eslint-disable no-sequences */
/* eslint-disable no-return-assign */
/* eslint-disable id-length */
export function pickProps<T>(obj: T, props: string[]): Partial<T> {
  return props.reduce((a, e) => (a[e] = obj[e], a), {})
}
export function omitProps(obj: object, props: string[]): any {
  return props.reduce((r, key) => (delete r[key], r), {...obj})
}
export const getRandomNumber = (from = 1, to = 100): number => Math.floor((Math.random() * (to)) + from)
