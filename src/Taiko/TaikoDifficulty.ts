import Difficulty from '../Difficulty';
import TaikoHitObject, { NoteType } from './TaikoHitObject';
import TaikoBeatmap from './TaikoBeatmap';

const 
    rhythm_change_base_threshold = 0.2,
    rhythm_change_base = 2,
    strain_decay_base = 0.3,
    star_scaling_factor = 0.04125;

enum ColourSwitch {
    None,
    Even,
    Odd 
}

interface TaikoDifficultyHitObject {
    object: TaikoHitObject,
    strain: number
}

export default function CalculateDifficulty(beatmap: TaikoBeatmap, timeScale: number = 1): TaikoDifficulty {
    let lastColour = ColourSwitch.None;
    let sameColourCount = 1;

    function hasColourChange(current: TaikoHitObject, previous: TaikoHitObject) {
        if(previous === undefined) return false;

        let typeChange = previous.Type == current.Type;
    
        if(!typeChange) {
            sameColourCount++;
            return false;
        }

        let oldColour = lastColour;
        let newColour = sameColourCount % 2 ? ColourSwitch.Odd : ColourSwitch.Even;

        lastColour = newColour;
        sameColourCount = 1;

        return oldColour != ColourSwitch.None && oldColour != newColour;
    }

    let strain = 1;
    let sectionPeak = 1;

    let objects: TaikoDifficultyHitObject[] = beatmap.HitObjects.map(object => ({ object, strain: 1 }));

    for(let i = 0; i < objects.length; i++) {
        let obj = objects[i];
        let previous = i == 0 ? null : objects[i - 1];
        let addition = 1;

        if(obj.object.IsNote && obj.object.DeltaTime < 1e3) {
            if(hasColourChange(obj.object, previous?.object))
                addition += 0.75;

            if(hasRhythmChange(obj.object, previous?.object))
                addition += 1;
        } else {
            lastColour = ColourSwitch.None;
            sameColourCount = 1;
        }

        let additionFactor = 1;

        if(obj.object.DeltaTime < 50)
            additionFactor = 0.4 + 0.6 * obj.object.DeltaTime / 50;

        objects[i].strain = addition * additionFactor;
    }

    let strainStep = 400 * timeScale,
        highestStrains = [],
        interval = strainStep,
        maxStrain = 0;

    let last: TaikoDifficultyHitObject = null;

    for(let o of objects) {
        while(o.object.StartTime > interval) {
            highestStrains.push(maxStrain);

            if(last === null) maxStrain = 0;
            else {
                let decay = Math.pow(strain_decay_base, (interval - o.object.StartTime) / 1e3);
                maxStrain = last.strain * decay;
            }

            interval += strainStep;
        }

        last = o;
    }

    let difficulty = 0,
        weight = 1;

    for(let strain of highestStrains.sort((a, b) => b - a)) {
        difficulty += strain * weight;
        weight *= 0.9;
    }

    return new TaikoDifficulty(difficulty * star_scaling_factor);
}

function hasRhythmChange(current: TaikoHitObject, previous: TaikoHitObject) {
    if(previous === undefined || current.StartTime - previous?.DeltaTime == 0)
        return false;
    
    let timeElapsedRatio = Math.max(previous.DeltaTime / current.DeltaTime, current.DeltaTime / previous.DeltaTime);

    if(timeElapsedRatio >= 8)
        return false;

    let difference = (Math.log(timeElapsedRatio) / Math.log(rhythm_change_base)) % 1.0;
    return difference > rhythm_change_base_threshold && difference < 1 - rhythm_change_base_threshold;
}

export class TaikoDifficulty extends Difficulty {
    calculatePP(score: any): number {
        return 0;
    }
}