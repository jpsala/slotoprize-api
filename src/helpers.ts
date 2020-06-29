export function pickProps(obj: object, props: string[]): object {
  return props.reduce((a, e) => (a[e] = obj[e], a), {})
}
