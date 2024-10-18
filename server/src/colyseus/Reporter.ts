import {prisma} from "../database";

export const reportSession = async ({width, height, roomInstanceId, homeURL}:any)=>{
    if(!prisma) return;
    await prisma!.browserSession.create({
        data:{
            homeURL,
            roomInstanceId,
            width,
            height
        }
    })
};