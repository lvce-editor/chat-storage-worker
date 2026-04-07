export const isTimeValue = (value: number | string | undefined): value is number | string => {
  return typeof value === 'number' || typeof value === 'string'
}
