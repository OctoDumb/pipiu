import Difficulty from '../Difficulty';
import TaikoHitObject, { NoteType } from './TaikoHitObject';
import TaikoBeatmap from './TaikoBeatmap';

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

class TaikoDifficultyCalculator {
    private readonly rhythm_change_base_threshold = 0.2;
    private readonly rhythm_change_base = 2;
    private readonly strain_decay_base = 0.3;
    private readonly star_scaling_factor = 0.04125;

    public diff: TaikoDifficulty; 

    constructor(
        private readonly beatmap: TaikoBeatmap,
        private timeScale: number = 1
    ) {
        const objects: TaikoDifficultyHitObject[] = this.computeStrains();
        const highestStrains: number[] = this.calcHighestStrains(objects);
        const difficulty: number = this.calcDifficulty(highestStrains);

        this.diff = new TaikoDifficulty(difficulty * this.star_scaling_factor);
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
    
        let difference: number = (Math.log(timeElapsedRatio) / Math.log(this.rhythm_change_base)) % 1.0;
    
        return (
            difference > this.rhythm_change_base_threshold &&
            difference < 1 - this.rhythm_change_base_threshold
        ) ? 1 : 0;
    }

    private computeStrains(): TaikoDifficultyHitObject[] {
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

        return objects;
    }

    private calcHighestStrains(
        objects: TaikoDifficultyHitObject[]
    ): number[] {
        let sectionLen: number = 400 * this.timeScale;
        let curSectionEnd: number = Math.ceil(objects[0].object.StartTime / sectionLen) * sectionLen;
        let curSectionPick: number = 0;
        let highestStrains: number[] = [];

        let prev: TaikoDifficultyHitObject = null;

        for(let o of objects) {
            while(o.object.StartTime > curSectionEnd) {
                highestStrains.push(curSectionPick);
                
                if (!prev) 
                    curSectionPick = 0;
                else {
                    let decay = Math.pow(this.strain_decay_base, (curSectionEnd - prev.object.StartTime) / 1e3);
                    curSectionPick = prev.strain * decay;
                }

                curSectionEnd += sectionLen;
            }
            curSectionPick = Math.max(curSectionPick, o.strain);

            prev = o;
        }

        return highestStrains.sort((a, b) => b - a);
    }

    private calcDifficulty(highestStrains: number[]) {
        let difficulty: number = 0,
            weight: number = 1;

        for(let strain of highestStrains) {
            difficulty += strain * weight;
            weight *= 0.9;
        }

        return difficulty;
    }
}

export class TaikoDifficulty extends Difficulty {
    calculatePP(score: any): number {
        return 0;
    }
}