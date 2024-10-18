import {AudioSource, AudioStream, Entity} from "@dcl/sdk/ecs";

export const audioSources:any = {};//[entity][src]
const audioStreams = {};//[entity][src]

export const playSoundOnEntity = (
    entity:Entity,
    audioClipUrl: string,
    volume:number = 1
) => {
    console.log("playSoundOnEntity",audioClipUrl)
    audioSources[entity] = audioSources[entity] || {};
    if(!audioSources[entity][audioClipUrl]){
        audioSources[entity][audioClipUrl] = AudioStream.create(entity, {
            url:audioClipUrl,
            volume,
            playing:false
        });
    }
    let audio = AudioStream.getMutable(entity)
    audio.volume = volume;
    audio.playing = true;
}