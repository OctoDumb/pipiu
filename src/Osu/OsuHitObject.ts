import HitObject, { HitObjectType } from '../HitObject';
// import OsuBeatmap from './OsuBeatmap';
import { DataHitObject } from '../Parser';

export default class OsuHitObject extends HitObject {
    Type: HitObjectType;
    Distance?: number;
    Repeat?: number;
    constructor(data: DataHitObject, delta: number) {
        super(data);
        this.DeltaTime = delta;
        this.Type = data.type;
        if(this.Type & HitObjectType.Slider) {
            this.Distance = Number(data.other[3]);
            this.Repeat = Number(data.other[2]);
            // Add EndTime
        } else if(this.Type & HitObjectType.Spinner) {
            // Add EndTime parsing
        }
    }
}