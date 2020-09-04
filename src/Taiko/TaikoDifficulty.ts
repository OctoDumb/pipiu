import Difficulty from '../Difficulty';
import TaikoHitObject, { NoteType } from './TaikoHitObject';
import TaikoBeatmap from './TaikoBeatmap';
import { DifficultyCalculator } from '../DifficultyCalculator';

enum ColourSwitch {
    None,
    Even,
    Odd 
}

interface TaikoDifficultyHitObject {
    object: TaikoHitObject,
    strain: number
}

export default function CalculateDifficulty(
    beatmap: TaikoBeatmap,
    timeScale: number
): TaikoDifficulty {
    return new TaikoDifficultyCalculator(beatmap, timeScale).diff;
}

class TaikoDifficultyCalculator extends DifficultyCalculator {
    private readonly RHYTHM_CHANGE_BASE_THRESHOLD = 0.2;
    private readonly RHYTHM_CHANGE_BASE = 2;
    private readonly STRAIN_DECAY_BASE = 0.3;
    protected readonly STAR_SCALING_FACTOR = 0.04125;

    private objects: TaikoDifficultyHitObject[];

    public diff: TaikoDifficulty;

    constructor(
        private readonly beatmap: TaikoBeatmap,
        private timeScale: number = 1
    ) {
        super();
        this.initObjects();
        const highestStrains: number[] = this.calcHighestStrains();
        const difficulty: number = this.calcDifficulty(highestStrains);

        this.diff = new TaikoDifficulty(difficulty * this.STAR_SCALING_FACTOR);
    }

    private prevColour: ColourSwitch = ColourSwitch.None;
    private sameColourCount: number = 1;

    private applyColourChange(
        cur: TaikoDifficultyHitObject,
        prev: TaikoDifficultyHitObject
    ): number  {
        const typeChange: Boolean = prev.object.Type != cur.object.Type;

        if (!typeChange) {
            this.sameColourCount++;
            return 0;
        }

        let oldColour: ColourSwitch = this.prevColour;
        let newColour: ColourSwitch = this.sameColourCount % 2 ? ColourSwitch.Even : ColourSwitch.Odd;

        this.prevColour = newColour;
        this.sameColourCount = 1;

        return oldColour != ColourSwitch.None && oldColour != newColour ? 0.75 : 0;
    }

    private applyRhythmChange(
        cur: TaikoDifficultyHitObject, 
        prev: TaikoDifficultyHitObject
    ): number {
        if(
            !prev || 
            cur.object.StartTime - prev.object.DeltaTime == 0
        ) return 0;
        
        let timeElapsedRatio: number = Math.max(
            prev.object.DeltaTime / cur.object.DeltaTime, 
            cur.object.DeltaTime / prev.object.DeltaTime
        );
    
        if(timeElapsedRatio >= 8) return 0;
    
        let difference: number = (Math.log(timeElapsedRatio) / Math.log(this.RHYTHM_CHANGE_BASE)) % 1.0;
    
        return (
            difference > this.RHYTHM_CHANGE_BASE_THRESHOLD &&
            difference < 1 - this.RHYTHM_CHANGE_BASE_THRESHOLD
        ) ? 1 : 0;
    }

    protected initObjects() {
        let strain: number = 1;
        let objects: TaikoDifficultyHitObject[] = this.beatmap.HitObjects.map(object => ({ object, strain }));

        objects.sort((a, b) => a.object.StartTime - b.object.StartTime);

        objects.forEach((cur, i, arr) => {
            let prev: TaikoDifficultyHitObject = arr[i - 1];
            if (!prev) return;

            let addition: number = 1;
            let decay: number = Math.pow(0.3, cur.object.DeltaTime / 1e3);
            
            if (cur.object.IsNote && cur.object.DeltaTime < 1e3) {
                addition += this.applyColourChange(cur, prev);
                addition += this.applyRhythmChange(cur, prev);
            } else {
                this.prevColour = ColourSwitch.None;
                this.sameColourCount = 1;
            }

            let additionFactor = cur.object.DeltaTime < 50 
                ? 0.4 + 0.6 * cur.object.DeltaTime / 50 
                : 1;
    
            objects[i].strain = prev.strain * decay + addition * additionFactor;
        });

        this.objects = objects;
    }

    protected calcHighestStrains(): number[] {
        let sectionLen: number = 400 * this.timeScale;
        let curSectionEnd: number = Math.ceil(this.objects[0].object.StartTime / sectionLen) * sectionLen;
        let curSectionPick: number = 0;
        let highestStrains: number[] = [];

        let prev: TaikoDifficultyHitObject = null;

        for(let o of this.objects) {
            while(o.object.StartTime > curSectionEnd) {
                highestStrains.push(curSectionPick);
                
                if (!prev) curSectionPick = 0;
                else {
                    let decay = Math.pow(this.STRAIN_DECAY_BASE, (curSectionEnd - prev.object.StartTime) / 1e3);
                    curSectionPick = prev.strain * decay;
                }

                curSectionEnd += sectionLen;
            }
            curSectionPick = Math.max(curSectionPick, o.strain);

            prev = o;
        }

        return highestStrains.sort((a, b) => b - a);
    }
}

export class TaikoDifficulty extends Difficulty {
    calculatePP(score: any): number {
        return 0;
    }
}