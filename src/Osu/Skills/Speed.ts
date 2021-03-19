import DifficultyHitObject from "../../DifficultyHitObject";
import OsuDifficultyHitObject from "../HitObjects/OsuDifficultyHitObject";
import Skill from "../../Skill";
import { HitObjectType } from "../../HitObject";

export default class Speed extends Skill {
    private readonly single_spacing_threshold: number = 125;

    private readonly angle_bonus_begin: number = 5 * Math.PI / 6;
    private readonly pi_over_4: number = Math.PI / 4;
    private readonly pi_over_2: number = Math.PI / 2;

    protected SkillMultiplier: number = 1400;
    protected StrainDecayBase: number = 0.3;

    private min_speed_bonus: number = 75;
    private max_speed_bonus: number = 45;
    private speed_balancing_factor: number = 40;

    protected strainValueOf(current: DifficultyHitObject) {
        let currentOsu = <OsuDifficultyHitObject>current;

        if (currentOsu.Type & HitObjectType.Spinner)
            return 0;

        let distance = Math.min(this.single_spacing_threshold, currentOsu.TravelDistance + currentOsu.JumpDistance);
        let deltaTime = Math.max(this.max_speed_bonus, currentOsu.DeltaTime);

        let speedBonus = 1;

        if (deltaTime < this.min_speed_bonus)
            speedBonus = 1 + Math.pow((this.min_speed_bonus - deltaTime) / this.speed_balancing_factor, 2);
        
        let angleBonus = 1;

        if (currentOsu.Angle && currentOsu.Angle < this.angle_bonus_begin) {
            angleBonus = 1 + Math.pow(Math.sin(1.5 * (this.angle_bonus_begin - currentOsu.Angle)), 2) / 3.57;

            if (currentOsu.Angle < this.pi_over_2) {
                angleBonus = 1.28;

                if (distance < 90 && currentOsu.Angle < this.pi_over_4)
                    angleBonus += (1 - angleBonus) * Math.min((90 - distance) / 10, 1);
                else if (distance < 90)
                    angleBonus += (1 - angleBonus) * Math.min((90 - distance) / 10, 1) * Math.sin((this.pi_over_2 - currentOsu.Angle) / this.pi_over_4);
            }
        }

        return (1 + (speedBonus - 1) * 0.75) * angleBonus * (0.95 + speedBonus * Math.pow(distance / this.single_spacing_threshold, 3.5)) / currentOsu.StrainTime;
    }
}

