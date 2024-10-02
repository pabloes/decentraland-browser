export const sleep = (ms: number) => new Promise((res:Function) => setTimeout(res, ms));
