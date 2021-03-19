import DifficultyHitObject from "../../DifficultyHitObject";
import ManiaHitObject from "./ManiaHitObject"
import { HitObjectType } from "../../HitObject";

export default class ManiaDifficultyHitObject extends DifficultyHitObject {
    constructor(
        hitObject: ManiaHitObject,
        lastObject: ManiaHitObject,
        clockRate: number,
    ) {
        super(hitObject, lastObject, clockRate);
    }
}