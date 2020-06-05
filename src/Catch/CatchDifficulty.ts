import Difficulty from "../Difficulty";
import CatchBeatmap from "./CatchBeatmap";
import CatchHitObject from "./CatchHitObject";
import { Clamp, Sign } from "../Util";
import { ABSOLUTE_PLAYER_POSITIONING_ERROR as errorMargin, NORMALIZED_HITOBJECT_RADIUS, DECAY_BASE, DIRECTION_CHANGE_BONUS, STRAIN_STEP, DECAY_WEIGHT, STAR_SCALING_FACTOR } from "./CatchConstants";

class CatchDifficultyHitObject {
    Strain = 1;
    Offset = 0;
    LastMovement = 0;
    HitObject: CatchHitObject;
    PlayerWidth: number;
    ScaledPosition: number;
    HyperdashDistance = 0;
    Hyperdash = false;
    constructor(hitObject: CatchHitObject, playerWidth: number) {
        this.HitObject = hitObject;
        this.PlayerWidth = playerWidth;
        this.ScaledPosition = hitObject.X * (NORMALIZED_HITOBJECT_RADIUS / playerWidth);
    }

    calculateStrain(last: CatchDifficultyHitObject, timeScale: number) {
        let time = (this.HitObject.StartTime - last.HitObject.StartTime) / timeScale;
        let decay = Math.pow(DECAY_BASE, time / 1e3);

        this.Offset = Clamp(last.ScaledPosition + last.Offset,
            this.ScaledPosition - (NORMALIZED_HITOBJECT_RADIUS - errorMargin),
            this.ScaledPosition + (NORMALIZED_HITOBJECT_RADIUS - errorMargin)
        ) - this.ScaledPosition;

        this.LastMovement = Math.abs(this.ScaledPosition - last.ScaledPosition + this.Offset - last.Offset);

        let addition = Math.pow(this.LastMovement, 1.3) / 500;

        if(this.ScaledPosition < last.ScaledPosition)
            this.LastMovement *= -1;

        let additionBonus = 0;
        let sqrtTime = Math.sqrt(Math.max(time, 25));

        if(Math.abs(this.LastMovement) > 0.1) {
            if(Math.abs(last.LastMovement) > 0.1 && Sign(this.LastMovement) != Sign(last.LastMovement)) {
                let bonus = DIRECTION_CHANGE_BONUS / sqrtTime;
                let bonusFactor = Math.min(errorMargin, Math.abs(this.LastMovement)) / errorMargin;

                addition += bonus * bonusFactor;

                if(last.HyperdashDistance <= 10)
                    additionBonus += 0.3 * bonusFactor;
            }

            addition += 7.5 * Math.min(
                Math.abs(this.LastMovement),
                NORMALIZED_HITOBJECT_RADIUS * 2
            ) / (NORMALIZED_HITOBJECT_RADIUS * 6) / sqrtTime;
        }

        if(last.HyperdashDistance <= 10) {
            if(!last.Hyperdash)
                additionBonus += 1;
            else
                this.Offset = 0;

            addition *= 1 + additionBonus * ((10 - last.HyperdashDistance) / 10);
        }

        addition *= 850 / Math.max(time, 25);
        this.Strain = last.Strain * decay + addition;
    }
}

export default function CalculateDifficulty(beatmap: CatchBeatmap, timeScale: number) {
    let hitObjectsWithTicks = [];

    for(let hitObject of beatmap.HitObjects) {
        hitObjectsWithTicks.push(hitObject);
        if(hitObject.IsSlider) hitObjectsWithTicks.push(...hitObject.Ticks, ...hitObject.EndTicks);
    }

    let playerWidth = 305 / 1.6 * ((102.4 * (1 - 0.7 * (beatmap.Stats.CS - 5) / 5)) / 128) * 0.7;

    let difficultyHitObjects: CatchDifficultyHitObject[] = hitObjectsWithTicks.map(o => new CatchDifficultyHitObject(o, playerWidth * 0.4));

    difficultyHitObjects = updateHyperdashDistance(difficultyHitObjects, playerWidth);

    difficultyHitObjects = calculateStrainValues(difficultyHitObjects, timeScale);

    return new CatchDifficulty(Math.sqrt(calculateDifficulty(difficultyHitObjects, timeScale)) * STAR_SCALING_FACTOR);
}

function updateHyperdashDistance(difficultyHitObjects: CatchDifficultyHitObject[], playerWidth: number) {
    let lastDirection = 0,
        playerWidthHalf = playerWidth / 2 * 0.8,
        last = playerWidthHalf;

    let obj = difficultyHitObjects;

    for(let i = 0; i < obj.length - 1; i++) {
        let current = obj[i];
        let next = obj[i + 1];

        let direction = next.HitObject.X > current.HitObject.X
            ? 1 : -1;
        
        let timeToNext = next.HitObject.StartTime - current.HitObject.StartTime - (25 / 6);
        let distToNext = Math.abs(next.HitObject.X - current.HitObject.X);
        
        distToNext -= lastDirection == direction ? last : playerWidthHalf;

        if(timeToNext < distToNext) {
            current.Hyperdash = true;
            last = playerWidthHalf;
        } else {
            current.HyperdashDistance = timeToNext - distToNext;
            last = Clamp(current.HyperdashDistance, 0, playerWidthHalf);
        }

        lastDirection = direction;
        obj[i] = current;
    }

    return obj;
}

function calculateStrainValues(difficultyHitObjects: CatchDifficultyHitObject[], timeScale: number) {
    let current = difficultyHitObjects[0];

    for(let i = 1; i < difficultyHitObjects.length; i++) {
        let next = difficultyHitObjects[i];
        next.calculateStrain(current, timeScale);
        current = next;
        difficultyHitObjects[i] = current;
    }

    return difficultyHitObjects;
}

function calculateDifficulty(difficultyHitObjects: CatchDifficultyHitObject[], timeScale: number) {
    let strainStep = STRAIN_STEP * timeScale,
        highestStrains = [],
        interval = strainStep,
        maxStrain = 0;

    let last: CatchDifficultyHitObject = null;
    for(let object of difficultyHitObjects) {
        while(object.HitObject.StartTime > interval) {
            highestStrains.push(maxStrain);

            if(!last) maxStrain = 0;
            else {
                let decay = Math.pow(DECAY_BASE, (interval - last.HitObject.StartTime) / 1e3);
                maxStrain = last.Strain * decay;
            }

            interval += strainStep;
        }

        maxStrain = Math.max(maxStrain, object.Strain);

        last = object;
    }

    let difficulty = 0,
        weight = 1;

    for(let strain of highestStrains.sort((a, b) => b - a)) {
        difficulty += strain * weight;
        weight *= DECAY_WEIGHT;
    }

    return difficulty;
}

export class CatchDifficulty extends Difficulty {
    calculatePP(score: any): number {
        return 0;
    }
}