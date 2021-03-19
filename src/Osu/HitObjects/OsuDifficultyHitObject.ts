import DifficultyHitObject from "../../DifficultyHitObject";
import OsuHitObject from "./OsuHitObject"
import { HitObjectType } from "../../HitObject";
import Vector from "../../Vector";

export default class OsuDifficultyHitObject extends DifficultyHitObject {
    private normalized_radius: number = 52;

    public Type: HitObjectType;

    public JumpDistance: number;
    public TravelDistance: number;

    public Angle?: number | null;

    public readonly StrainTime: number;

    private readonly baseObject: OsuHitObject;
    private readonly lastObject: OsuHitObject;
    private readonly lastLastObject: OsuHitObject;

    constructor(
        hitObject: OsuHitObject,
        lastLastObject: OsuHitObject,
        lastObject: OsuHitObject,
        clockRate: number,
        circleSize: number,
    ) {
        super(hitObject, lastObject, clockRate);

        this.baseObject = hitObject;
        this.lastObject = lastObject;
        this.lastLastObject = lastLastObject;

        this.Type = hitObject.Type;

        this.setDistances(circleSize);

        this.StrainTime = Math.max(50, this.DeltaTime);
    }

    private setDistances(cs: number) {
        const playfield = new Vector(512, 384);
        let radius = (playfield.X / 16) * (1 - 0.7 * (cs - 5) / 5);
        let scalingFactor = this.normalized_radius / radius;

        if (radius < 30) {
            const smallCircleBonus = Math.min(30 - radius, 5) / 50;
            scalingFactor *= (1 + smallCircleBonus);
        }

        let scalingVector = new Vector(scalingFactor);
        let normalizedCentre = playfield.mul(scalingVector);

        let curpos = this.getNormPos(this.baseObject, scalingVector, normalizedCentre);
        let prev1pos = this.getNormPos(this.lastObject, scalingVector, normalizedCentre);;

        this.JumpDistance = curpos.sub(prev1pos).Length;
        this.TravelDistance = prev1pos.Length;
        
        
        if (this.lastLastObject) {
            let prev2pos = this.getNormPos(this.lastLastObject, scalingVector, normalizedCentre);

            let v1 = prev2pos.sub(prev1pos);
            let v2 = curpos.sub(prev1pos);

            let dot = v1.dot(v2);
            let det = v1.X * v2.Y - v1.Y * v2.X;

            this.Angle = Math.abs(Math.atan2(det, dot));
        } else {
            this.Angle = null;
        }
    }

    private getNormPos(
        object: OsuHitObject,
        scalingVector: Vector,
        normalizedCentre: Vector,
    ): Vector {
        if (object.Type & HitObjectType.Spinner)
            return normalizedCentre.Copy;
        else
            return scalingVector.mul(this.baseObject.X, this.baseObject.Y);
    }
}