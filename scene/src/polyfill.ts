import "xmlhttprequest-polyfill";

// @ts-ignore
import { URL } from "whatwg-url-without-unicode";

// @ts-ignore
(globalThis as any)['URL'] = URL as any;