import Beatmap from "./Beatmap";
import DifficultyHitObject from "./DifficultyHitObject";
import Mods from "./Mods";
import Skill from "./Skill";

export abstract class DifficultyCalculator {
    protected SectionLength: number = 400;

    protected readonly DECAY_WEIGHT: number = 0.9;

    constructor(
        private beatmap: Beatmap
    ) { }

    public calculate(
        mods: Mods[],
        clockRate: number,
    ) {
        let beatmap = this.beatmap;
        let skills = this.createSkill(beatmap, mods);

        if (!this.beatmap.HitObjects.length)
            return;
        
        let difficultyHitObjects = this.sortObjects(this.createDifficultyHitObjects(beatmap, clockRate));

        let sectionLength = this.SectionLength * clockRate;

        let currentSectionEnd = Math.ceil(beatmap.HitObjects[0].StartTime / sectionLength) * sectionLength;

        for (let h of difficultyHitObjects) {
            while (h.BaseObject.StartTime > currentSectionEnd) {
                for (let s of skills) {
                    s.saveCurrentPeak();
                    s.startNewSectionFrom(currentSectionEnd);
                }

                currentSectionEnd += sectionLength;
            }

            for (let s of skills) s.process(h);
        }

        for (let s of skills) s.saveCurrentPeak();

        return this.createDifficultyAttributes(beatmap, mods, skills, clockRate);
    }

    protected sortObjects(input: DifficultyHitObject[]) {
        return input.sort((a, b) => a.BaseObject.StartTime - b.BaseObject.StartTime);
    }

    protected abstract createDifficultyAttributes(beatmap: Beatmap, mods: Mods[], skills: Skill[], clockRate: number);
    protected abstract createDifficultyHitObjects(beatmap: Beatmap, clockRate: number): DifficultyHitObject[];
    protected abstract createSkill(beatmap: Beatmap, mods: Mods[]): Skill[];
}