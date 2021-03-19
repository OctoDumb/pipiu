import HitObject, { HitObjectType } from "../../HitObject";
import { DataHitObject } from "../../Parser";

export default class ManiaHitObject extends HitObject {
    Column: number;
    constructor(data: DataHitObject, keys: number) {
        super(data);
        this.Column = Math.ceil(this.X / 512 * Math.floor(keys)) - 1;
        
        if(data.type & HitObjectType.Hold || data.type & HitObjectType.Slider)
            this.EndTime = Number(data.other[1].split(":")[0]);
        else 
            this.EndTime = this.StartTime;
    }
}