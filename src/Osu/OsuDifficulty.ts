
import { DifficultyCalculator } from '../DifficultyCalculator';
import Beatmap from "../Beatmap";
import Mods from "../Mods";
import Skill from "../Skill";
import Aim from "./Skills/Aim";
import Speed from "./Skills/Speed";
import DifficultyHitObject from '../DifficultyHitObject';
import OsuHitObject from './HitObjects/OsuHitObject';
import OsuDifficultyHitObject from './HitObjects/OsuDifficultyHitObject';

/* export default function calculateDifficulty(beatmap: OsuBeatmap): OsuDifficulty {
    return new OsuCalculator(beatmap).diff;
}
 */
export default class OsuCalculator extends DifficultyCalculator{
    private readonly difficulty_multiplier = 0.0675;

    createDifficultyAttributes(
        beatmap: Beatmap, 
        mods: Mods[], 
        skills: Skill[], 
        clockRate: number,
    ) {
        if (!beatmap.HitObjects.length) 
            return;

        let aimRating = Math.sqrt(skills[0].difficultyValue()) * this.difficulty_multiplier;
        let speedRating = Math.sqrt(skills[1].difficultyValue()) * this.difficulty_multiplier;
        let starRating = aimRating + speedRating + Math.abs(aimRating - speedRating) / 2;

        return starRating;
    }

    protected createDifficultyHitObjects(
        beatmap: Beatmap, 
        clockRate: number
    ): DifficultyHitObject[] {
        let objects: DifficultyHitObject[] = [];

        for (let i = 1; i < beatmap.HitObjects.length; i++) {
            let lastLast = i > 1 ? <OsuHitObject>beatmap.HitObjects[i - 2] : null;
            let last = <OsuHitObject>beatmap.HitObjects[i - 1];
            let current = <OsuHitObject>beatmap.HitObjects[i];

            objects.push(new OsuDifficultyHitObject(current, lastLast, last, clockRate, beatmap.Stats.CS));
        }

        return objects;
    };

    protected createSkill(beatmap: Beatmap, mods: Mods[]): Skill[] {
        return [
            new Aim(mods),
            new Speed(mods),
        ]
    }
}