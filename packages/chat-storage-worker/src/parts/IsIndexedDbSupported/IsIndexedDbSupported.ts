import { getIndexedDbSupportOverride } from '../IndexedDbSupportOverride/IndexedDbSupportOverride.ts'

export const isIndexedDbSupported = (indexedDbSupportOverride?: boolean): boolean => {
  if (typeof indexedDbSupportOverride === 'boolean') {
    return indexedDbSupportOverride
  }
  const override = getIndexedDbSupportOverride()
  if (typeof override === 'boolean') {
    return override
  }
  return globalThis.indexedDB != undefined
}
