import Skill from "../../Skill";
import Mods from "../../Mods";
import ManiaHitObject from "../HitObjects/ManiaHitObject";
import DifficultyHitObject from "../../DifficultyHitObject";
import ManiaDifficultyHitObject from "../HitObjects/ManiaDifficultyHitObject";
import Precicion from "../../Helpers/Precision";

export default class Strain extends Skill {
    private readonly individual_decay_base: number = 0.125;
    private readonly overall_decay_base: number = 0.3;

    protected readonly SkillMultiplier: number = 1;
    protected readonly StrainDecayBase: number = 1;

    private readonly holdEndTimes: number[] = [];
    private readonly individualStrains: number[] = [];

    private individualStrain: number;
    private overallStrain: number = 1;

    constructor(mods: Mods[], totalColumns: number) {
        super(mods);

        this.holdEndTimes = new Array(totalColumns).fill(0);
        this.individualStrains = new Array(totalColumns).fill(0);
    }

    protected strainValueOf(current: DifficultyHitObject) {
        let currentMania = <ManiaDifficultyHitObject>current;
        let baseObject = <ManiaHitObject>currentMania.BaseObject;
        let column = baseObject.Column;

        let holdFactor = 1;
        let holdAddition = 0;

        for (let i = 0; i < this.holdEndTimes.length; ++i) {
            if (
                Precicion.definitelyBigger(this.holdEndTimes[i], baseObject.StartTime, 1) &&
                Precicion.definitelyBigger(baseObject.EndTime, this.holdEndTimes[i], 1)
            ) holdAddition = 1;

            if (Precicion.almostEquals(baseObject.EndTime, this.holdEndTimes[i], 1))
                holdAddition = 0;
            
            if (Precicion.definitelyBigger(this.holdEndTimes[i], baseObject.EndTime, 1))
                holdFactor = 1.25;

            this.individualStrains[i] = this.applyDecay(this.individualStrains[i], currentMania.DeltaTime, this.individual_decay_base);
        }

        this.holdEndTimes[column] = baseObject.EndTime;

        this.individualStrains[column] += 2 * holdFactor;
        this.individualStrain = this.individualStrains[column];

        this.overallStrain = this.applyDecay(this.overallStrain, currentMania.DeltaTime, this.overall_decay_base) + (1 + holdAddition) * holdFactor;

        return this.individualStrain + this.overallStrain - this.CurrentStrain;
    }

    protected getPeakStrain(offset: number) {
        let prev = this.Previous[this.Previous.length - 1].BaseObject;

        return this.applyDecay(this.individualStrain, offset - prev.StartTime, this.individual_decay_base)
            + this.applyDecay(this.overallStrain, offset - prev.StartTime, this.overall_decay_base);
    }

    private applyDecay(
        value: number,
        deltaTime: number,
        decayBase: number,
    ) {
        return value * Math.pow(decayBase, deltaTime / 1000);
    }
}

