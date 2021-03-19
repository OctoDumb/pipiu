import HitObject, { HitObjectType } from '../../HitObject';
import { DataHitObject } from '../../Parser';

export default class OsuHitObject extends HitObject {
    Type: HitObjectType;
    constructor(data: DataHitObject) {
        super(data);
        this.Type = data.type;
    }
}