import Difficulty from "../Difficulty";
import ManiaBeatmap from "./ManiaBeatmap";
import ManiaHitObject from "./ManiaHitObject";
import { DifficultyCalculator } from "../DifficultyCalculator";

interface ManiaDifficultyHitObject {
    note: ManiaHitObject;
    individualStrain: number[];
    overallStrain: number;
}

export default function CalculateDifficulty(
    beatmap: ManiaBeatmap,
    timeScale: number
): ManiaDifficulty {
    //console.log(timeScale)
    return new ManiaDifficultyCalculator(beatmap, timeScale).diff;
}

class ManiaDifficultyCalculator extends DifficultyCalculator {
    private readonly INDIVIDUAL_DECAY_BASE = 0.125;
    private readonly OVERALL_DECAY_BASE = 0.3;
    protected readonly STAR_SCALING_FACTOR = 0.018;

    private objects: ManiaDifficultyHitObject[];

    public readonly diff: ManiaDifficulty;

    constructor(
        private readonly beatmap: ManiaBeatmap,
        private readonly timeScale: number = 1
    ) {
        super();
        this.initObjects();
        this.computeStrains();
        const highestStains: number[] = this.calcHighestStrains();
        const difficulty: number = this.calcDifficulty(highestStains);

        this.diff = new ManiaDifficulty(difficulty * this.STAR_SCALING_FACTOR);
    }

    protected initObjects() {
        this.objects = this.beatmap.HitObjects.map(note => ({ 
            note, 
            individualStrain: new Array(this.beatmap.Stats.CS).fill(0),
            overallStrain: 1
        }));

        this.objects.sort((a, b) => a.note.StartTime - b.note.StartTime);
    }

    private computeStrains() {
        let prev: ManiaDifficultyHitObject = this.objects[0];
        let heldUntil: number[] = new Array(this.beatmap.Stats.CS).fill(0);

        for(let object of this.objects.slice(1)) {
            let delta: number = (object.note.StartTime - prev.note.StartTime) / this.timeScale / 1e3;
            let individualDecay: number = this.INDIVIDUAL_DECAY_BASE ** delta;
            let overallDecay: number = this.OVERALL_DECAY_BASE ** delta;
            
            let holdFactor: number = 1,
                holdAddition: number = 0;
            
            for(let i = 0; i < this.beatmap.Stats.CS; i++) {
                if(object.note.StartTime < heldUntil[i] && object.note.EndTime > heldUntil[i])
                    holdAddition = 1;
                else if(object.note.EndTime == heldUntil[i])
                    holdAddition = 0;
                else if(object.note.EndTime < heldUntil[i])
                    holdFactor = 1.25;

                object.individualStrain[i] = prev.individualStrain[i] * individualDecay;
            }
            
            let column = object.note.Column - 1;

            heldUntil[column] = object.note.EndTime;

            object.individualStrain[column] += 2 * holdFactor;
            object.overallStrain = prev.overallStrain * overallDecay + (1 + holdAddition) * holdFactor;
            prev = object;
        }
    }

    protected calcHighestStrains(): number[] {
        let sectionLen: number = 400 * this.timeScale;
        let curSectionEnd: number = Math.ceil(this.objects[0].note.StartTime / sectionLen) * sectionLen;
        let curSectionPick = 0;
        let highestStains: number[] = [];

        let prev: ManiaDifficultyHitObject = null;

        for(let o of this.objects) {
            while(o.note.StartTime > curSectionEnd) {
                highestStains.push(curSectionPick);

                if(!prev) curSectionPick = 0;
                else {
                    let individualDecay = Math.pow(this.INDIVIDUAL_DECAY_BASE, (curSectionEnd - prev.note.StartTime) / 1e3);
                    let overallDecay = Math.pow(this.OVERALL_DECAY_BASE, (curSectionEnd - prev.note.StartTime) / 1e3);
                    curSectionPick = prev.individualStrain[prev.note.Column - 1] * individualDecay + prev.overallStrain * overallDecay;
                }

                curSectionEnd += sectionLen;
            }

            let strain = o.individualStrain[o.note.Column - 1] + o.overallStrain;
            curSectionPick = Math.max(curSectionPick, strain);

            prev = o;
        }

        return highestStains.sort((a, b) => b - a);
    }
}

export class ManiaDifficulty extends Difficulty {
    calculatePP(score: any): number {
        return 0;
    }
}