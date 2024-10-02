import {Callback} from "@dcl-sdk/utils/dist/timer";

export * from '@dcl/sdk'
import * as utils from '@dcl-sdk/utils'

export const dclSleep = (ms: number) => new Promise((resolve) => utils.timers.setTimeout(resolve as Callback, ms));
