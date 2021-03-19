import Mods from "./Mods";
import DifficultyHitObject from "./DifficultyHitObject";

export default abstract class Skill {
    protected readonly abstract SkillMultiplier: number;
    protected readonly abstract StrainDecayBase: number;

    protected DecayWeight: number = 0.9;

    protected Previous: DifficultyHitObject[] = [];

    protected CurrentStrain: number = 1;
    private CurrentSectionPeak: number = 1;

    private StrainPeaks: number[] = [];

    constructor(
        private mods: Mods[],
    ) { }

    public process(current: DifficultyHitObject) {
        this.CurrentStrain *= this.strainDecay(current.DeltaTime);
        this.CurrentStrain += this.strainValueOf(current) * this.SkillMultiplier;

        this.CurrentSectionPeak = Math.max(this.CurrentStrain, this.CurrentSectionPeak);

        this.Previous.push(current);
    }

    public saveCurrentPeak() {
        if (this.Previous.length > 0)
            this.StrainPeaks.push(this.CurrentSectionPeak);
    }

    public startNewSectionFrom(time: number)
    {
        if (this.Previous.length > 0)
            this.CurrentSectionPeak = this.getPeakStrain(time);
    }

    protected getPeakStrain(time: number): number {
        return this.CurrentStrain * this.strainDecay(time - this.Previous[this.Previous.length - 1].BaseObject.StartTime);
    } 

    public difficultyValue() {
        let difficulty: number = 0;
        let weight: number = 1;

        for (let strain of this.StrainPeaks.sort((a, b) => b - a)) {
            difficulty += strain * weight;
            weight *= this.DecayWeight;
        }

        return difficulty;
    }

    protected abstract strainValueOf(current: DifficultyHitObject): number;

    private strainDecay(ms: number) {
        return Math.pow(this.StrainDecayBase, ms / 1000);
    } 
}