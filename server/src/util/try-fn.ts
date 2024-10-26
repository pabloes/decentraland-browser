export const tryFn = async (fn:Function) => {
    try{
        await fn();
    }catch(error:Error|any){
        console.log(`tryFn error on ${fn.name}::`, error?.message)
    }
}