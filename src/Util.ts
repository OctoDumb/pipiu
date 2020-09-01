import { BeatmapData } from "./Parser";
import { TimingPoint, BeatmapBPM } from "./Beatmap";
import Mods from './Mods';

export function ApplyTimeScaling(mods: Mods) {
    let timeScale = 1;
    if((mods & Mods.DT) || (mods & Mods.NC)) 
        timeScale *= 1.5;
    else if(mods & Mods.HT) 
        timeScale *= 0.75;
    
    this.HitObjects = this.HitObjects.map(o => {
        this.StartTime /= timeScale;
        if(this.EndTime) this.EndTime /= timeScale;
        if(this.DeltaTime) this.DeltaTime /= timeScale;
    });
}

export function Clamp(value: number, b1: number, b2: number): number {
    let min = Math.min(b1, b2),
        max = Math.max(b1, b2);

    return Math.min(max, Math.max(min, value));
}

export function Sign(value: number) {
    return value >= 0;
}

export function Round(value: number, digits: number = 2) {
    return Number(value.toFixed(digits));
}