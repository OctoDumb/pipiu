import Difficulty from "../Difficulty";
import ManiaBeatmap from "./ManiaBeatmap";
import ManiaHitObject from "./ManiaHitObject";

interface ManiaDifficultyHitObject {
    note: ManiaHitObject;
    individualStrain: number[];
    overallStrain: number;
}

const 
    weightDecayBase = 0.9,
    individualDecayBase = 0.125,
    overallDecayBase = 0.3,
    starScalingFactor = 0.018;

export default function CalculateDifficulty(beatmap: ManiaBeatmap, timeScale: number = 1): ManiaDifficulty {
    const strainStep = 400 * timeScale;
    
    let heldUntil = new Array(beatmap.Stats.CS).fill(0);

    let notes: ManiaDifficultyHitObject[] = beatmap.HitObjects.map(note => ({ 
        note, 
        individualStrain: new Array(beatmap.Stats.CS).fill(0),
        overallStrain: 1
    }));

    let previousObject = notes[0];
    
    for(let object of notes.slice(1)) {
        let delta = (object.note.StartTime - previousObject.note.StartTime) / timeScale / 1e3;
        let individualDecay = Math.pow(individualDecayBase, delta);
        let overallDecay = Math.pow(overallDecayBase, delta);
        
        let holdFactor = 1,
            holdAddition = 0;

        for(let i = 0; i < beatmap.Stats.CS; i++) {
            heldUntil[i] = previousObject.note.EndTime;

            if(object.note.StartTime < heldUntil[i] && object.note.EndTime > heldUntil[i])
                holdAddition = 1;
            else if(object.note.EndTime == heldUntil[i])
                holdAddition = 0;
            else if(object.note.EndTime < heldUntil[i])
                holdFactor = 1.25;

            object.individualStrain[i] = previousObject.individualStrain[i] * individualDecay;
        }
        
        heldUntil[object.note.Column - 1] = object.note.EndTime;

        object.individualStrain[object.note.Column - 1] += 2 * holdFactor;
        object.overallStrain = previousObject.overallStrain * overallDecay + (1 + holdAddition) * holdFactor;

        previousObject = object;
    }

    let strainTable = [],
        maxStrain = 0,
        intervalEndTime = strainStep;

    previousObject = null;

    for(let object of notes) {
        while(object.note.StartTime > intervalEndTime) {
            strainTable.push(maxStrain);
            if(!previousObject) maxStrain = 0;
            else {
                let individualDecay = Math.pow(individualDecayBase, (intervalEndTime - previousObject.note.StartTime) / 1e3);
                let overallDecay = Math.pow(overallDecayBase, (intervalEndTime - previousObject.note.StartTime) / 1e3);
                maxStrain = previousObject.individualStrain[previousObject.note.Column - 1] * individualDecay + previousObject.overallStrain * overallDecay;
            }
            intervalEndTime += strainStep;
        }
        let strain = object.individualStrain[object.note.Column - 1] + object.overallStrain;
        maxStrain = Math.max(maxStrain, strain);
        previousObject = object;
    }

    let difficulty = 0,
        weight = 1;

    strainTable.sort((a, b) => b - a);
    
    for(let strain of strainTable) {
        difficulty += strain * weight;
        weight *= weightDecayBase;
    }

    return new ManiaDifficulty(difficulty * starScalingFactor);
}

export class ManiaDifficulty extends Difficulty {
    calculatePP(score: any): number {
        return 0;
    }
}