import DifficultyHitObject from "../../DifficultyHitObject";
import OsuDifficultyHitObject from "../HitObjects/OsuDifficultyHitObject";
import Skill from "../../Skill";
import { HitObjectType } from "../../HitObject";

export default class Aim extends Skill {
    private readonly angle_bonus_begin: number = Math.PI / 3;
    private readonly timing_threshold: number = 107;

    protected readonly SkillMultiplier: number = 26.25;
    protected readonly StrainDecayBase: number = 0.15;

    protected strainValueOf(current: DifficultyHitObject) {
        let currentOsu = <OsuDifficultyHitObject>current;

        if (currentOsu.Type & HitObjectType.Spinner)
            return 0;

        let result = 0;

        if (this.Previous.length > 0) {
            let prevOsu = <OsuDifficultyHitObject>this.Previous[this.Previous.length - 1];

            if (currentOsu.Angle && currentOsu.Angle > this.angle_bonus_begin) {
                const scale = 90;

                let angleBonus = Math.sqrt(
                    Math.max(prevOsu.JumpDistance - scale, 0)
                    * Math.pow(Math.sin(currentOsu.Angle - this.angle_bonus_begin), 2)
                    * Math.max(currentOsu.JumpDistance - scale, 0)
                );

                result = 1.5 * this.applyDiminishingExp(Math.max(0, angleBonus)) / Math.max(this.timing_threshold, prevOsu.StrainTime);
            }
        }

        let jumpDistanceExp: number = this.applyDiminishingExp(currentOsu.JumpDistance);
        let travelDistanceExp: number = this.applyDiminishingExp(currentOsu.TravelDistance);

        return Math.max(
            result + (jumpDistanceExp + travelDistanceExp + Math.sqrt(travelDistanceExp * jumpDistanceExp)) / Math.max(currentOsu.StrainTime, this.timing_threshold),
            (Math.sqrt(travelDistanceExp * jumpDistanceExp) + jumpDistanceExp + travelDistanceExp) / currentOsu.StrainTime
        );
    }

    private applyDiminishingExp(val: number): number {
        return Math.pow(val, 0.99);
    }
}