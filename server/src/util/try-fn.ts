export const tryFn = async (fn:Function) => {
    try{
        await fn();
    }catch(error){
        console.log(`tryFn error on ${fn.name}::`,error)
    }
}