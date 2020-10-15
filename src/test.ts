/* eslint-disable require-await */
// eslint-disable-next-line @typescript-eslint/require-await
export const test = async (): Promise<void> => {
  console.log('Test')
  const date = new Date(1900, 0, 1)
  console.log('date', date)
}