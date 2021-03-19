import { DifficultyCalculator } from '../DifficultyCalculator';
import Beatmap from "../Beatmap";
import Mods from "../Mods";
import Skill from "../Skill";
import ManiaHitObject from "./HitObjects/ManiaHitObject";
import ManiaDifficultyHitObject from "./HitObjects/ManiaDifficultyHitObject";
import DifficultyHitObject from '../DifficultyHitObject';
import Strain from "./Skills/Strain";

export default class ManiaDifficultyCalculator extends DifficultyCalculator {
    private readonly star_scaling_factor = 0.018;

    createDifficultyAttributes(
        beatmap: Beatmap, 
        mods: Mods[], 
        skills: Skill[], 
        clockRate: number,
    ) {
        let starRating = skills[0].difficultyValue() * this.star_scaling_factor;    

        return starRating;
    }

    protected createDifficultyHitObjects(
        beatmap: Beatmap, 
        clockRate: number
    ): DifficultyHitObject[] {
        let objects: DifficultyHitObject[] = [];

        for (let i = 1; i < beatmap.HitObjects.length; i++) {
            let last = <ManiaHitObject>beatmap.HitObjects[i - 1];
            let current = <ManiaHitObject>beatmap.HitObjects[i];

            objects.push(new ManiaDifficultyHitObject(current, last, clockRate));
        }

        return objects;
    };

    protected createSkill(beatmap: Beatmap, mods: Mods[]): Skill[] {
        return [
            new Strain(mods, beatmap.Stats.CS),
        ]
    }
}