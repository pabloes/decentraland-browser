import {prisma} from "../database";
import {Location} from "@prisma/client";

export const reportSession = async ({width, height, roomInstanceId, homeURL}:any)=>{
    if(!prisma) return;
    return (await prisma!.browserSession.create({
        data:{
            homeURL,
            roomInstanceId,
            width,
            height
        }
    })).id;
};

export const reportUser = async ({userId, isGuest, name}:any)=>{
    if(!prisma) return;
    const user= (await prisma!.user.findFirst({where:{userId}})) || (await prisma!.user.create({
        data: {userId, isGuest, name}
    }));
    if(user.name !== name){
        await prisma.user.updateMany({where:{userId}, data:{name}})
    }
    return user;
}

export const reportSessionLocation = async ({ reportedSessionId, location }: { reportedSessionId: number, location: Location }) => {
    if (!prisma) return;

    // Fetch the session and include its existing locations
    const session = await prisma.browserSession.findFirst({
        where: { id: reportedSessionId },
        include: { locations: true },
    });

    if (!session) {
        throw new Error("Session not found");
    }

    // Check if the location already exists in the session
    const locationExistsInSession = session.locations.some(
        (loc) => loc.coords === location.coords && loc.sceneName === location.sceneName
    );

    if (!locationExistsInSession) {
        // Check if the location exists globally by coords
        let existingLocation = await prisma.location.findFirst({
            where: {
                coords: location.coords, // We are matching based on coordinates
            },
        });

        // If the location exists, update the sceneName
        if (existingLocation) {
            existingLocation = await prisma.location.update({
                where: { id: existingLocation.id },
                data: { sceneName: location.sceneName }, // Update sceneName if needed
            });
        } else {
            // If the location does not exist globally, create it
            existingLocation = await prisma.location.create({
                data: {
                    coords: location.coords,
                    sceneName: location.sceneName,
                    owner: location.owner,
                },
            });
        }

        // Now connect the existing or newly created location to the session
        const updatedSession = await prisma.browserSession.update({
            where: { id: reportedSessionId },
            data: {
                locations: {
                    connect: { id: existingLocation.id }, // Connect the location by its ID
                },
            },
        });

        return updatedSession;
    }

    // If the location already exists in the session, return the session
    return session;
};

