import {AudioSource, AudioStream, Entity} from "@dcl/sdk/ecs";

export const audioSources:any = {};//[entity][src]
const audioStreams = {};//[entity][src]

export const playSoundOnEntity = (
    entity:Entity,
    audioClipUrl: string,
    loop?:boolean
) => {
    console.log("playSoundOnEntity",audioClipUrl)
    audioSources[entity] = audioSources[entity] || {};
    if(!audioSources[entity][audioClipUrl]){
        audioSources[entity][audioClipUrl] = AudioStream.create(entity, {
            url:audioClipUrl,
            volume:1,
            playing:false
        });
    }
    let audio = AudioStream.getMutable(entity)
    audio.volume = 1;
    audio.playing = true;
}