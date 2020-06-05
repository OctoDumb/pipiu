import { DataHitObject } from "./Parser";

export enum HitObjectType {
    Note = 1,
    Slider = 1 << 1,
    NewCombo = 1 << 2,
    Spinner = 1 << 3,
    Hold = 1 << 7
}

export default abstract class HitObject {
    X: number;
    Y: number;
    StartTime: number;
    EndTime?: number;
    DeltaTime: number;

    constructor(data: DataHitObject) {
        this.X = data.x;
        this.Y = data.y;
        this.StartTime = data.startTime;
    }
}