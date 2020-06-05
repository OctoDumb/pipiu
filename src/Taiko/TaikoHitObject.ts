import HitObject, { HitObjectType } from '../HitObject';
import TaikoBeatmap from './TaikoBeatmap';
import { DataHitObject } from "../Parser";

export enum NoteType {
    None,
    Circle,
    Rim
}

export default class TaikoHitObject extends HitObject {
    Type: NoteType;
    IsNote: boolean = false;
    constructor(data: DataHitObject, delta: number, beatmap: TaikoBeatmap) {
        super(data);
        this.DeltaTime = delta;
        this.Type = NoteType.None;
        if(data.type & HitObjectType.Note) {
            this.IsNote = true;
            let hitSounds = Number(data.other[0]);
            this.Type = (hitSounds & 10) ? NoteType.Circle : NoteType.Rim;
        } else if(data.type & HitObjectType.Slider) {
            let timingPoint = beatmap.getTimingPointAt(this.StartTime);
            let sv = timingPoint.velocity * beatmap.SliderMultiplier;
            let repeat = Number(data.other[2]);
            let length = Math.round((Number(data.other[3]) / (sv * 100)) * (6e4 / timingPoint.bpm) * repeat);
            this.EndTime = this.StartTime + length;
        } else if(data.type & HitObjectType.Spinner) {
            this.EndTime = Number(data.other[1]);
        }
    }
}