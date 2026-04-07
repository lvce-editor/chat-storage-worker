let indexedDbSupportOverride: boolean | undefined

export const getIndexedDbSupportOverride = (): boolean | undefined => {
  return indexedDbSupportOverride
}

export const setIndexedDbSupportOverride = (supported?: boolean): void => {
  indexedDbSupportOverride = supported
}
