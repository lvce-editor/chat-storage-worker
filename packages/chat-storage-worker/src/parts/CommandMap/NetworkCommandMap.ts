import { makeApiRequest } from '../MakeApiRequest/MakeApiRequest.ts'
import { makeStreamingApiRequest } from '../MakeStreamingApiRequest/MakeStreamingApiRequest.ts'

export const networkCommandMap = {
  'chatStorage.makeApiRequest': makeApiRequest,
  'chatStorage.makeStreamingApiRequest': makeStreamingApiRequest,
}
