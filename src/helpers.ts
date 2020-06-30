/* eslint-disable no-sequences */
/* eslint-disable no-return-assign */
/* eslint-disable id-length */
export function pickProps<T>(obj: T, props: string[]): Partial<T> {
  return props.reduce((a, e) => (a[e] = obj[e], a), {})
}
