import HitObject, { HitObjectType } from "../HitObject";
import { DataHitObject } from "../Parser";

export default class ManiaHitObject extends HitObject {
    X: number;
    Y: number;
    StartTime: number;
    EndTime: number;
    DeltaTime: number;
    Column: number;
    constructor(data: DataHitObject, delta: number, keys: number) {
        super(data);
        this.Column = Math.ceil(this.X / 512 * keys);
        if(data.type & HitObjectType.Hold || data.type & HitObjectType.Slider) {
            this.EndTime = Number(data.other[1].split(":")[0]);
        } else 
            this.EndTime = this.StartTime;
        this.DeltaTime = delta;
    }
}