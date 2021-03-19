import HitObject from "./HitObject";

export default class DifficultyHitObject {
    public readonly BaseObject: HitObject;
    public readonly LastObject: HitObject;
    public readonly DeltaTime: number;

    constructor(
        hitObject: HitObject, 
        lastObject: HitObject, 
        clockRate: number,
    ) {
        this.BaseObject = hitObject;
        this.LastObject = lastObject;
        this.DeltaTime = (hitObject.StartTime - lastObject.StartTime) / clockRate;
    }
}