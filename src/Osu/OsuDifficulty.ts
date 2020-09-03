import Difficulty from '../Difficulty';
import OsuHitObject from './OsuHitObject';
import OsuBeatmap from './OsuBeatmap';
import Vector from '../Vector';
import { HitObjectType } from '../HitObject';

interface OsuDifficultyHitObject {
    object: OsuHitObject;
    strains: [number, number];
    normPos: Vector;
    angle: number;
    single: boolean;
    dist: number;
}

const
    SINGLE_SPACING = 125,
    DECAY_BASE = [ 0.3, 0.15 ],
    WEIGHT_SCALING = [ 1400, 26.25 ],
    DECAY_WEIGHT = 0.9,
    STRAIN_STEP = 400,
    CS_BUFF_THRESHOLD = 30,
    STAR_SCALING_FACTOR = 0.0675,
    PLAYFIELD_SIZE = new Vector(512, 384),
    PLAYFIELD_CENTER = PLAYFIELD_SIZE.mul(0.5),
    MIN_SPEED_BONUS = 75,
    MAX_SPEED_BONUS = 45,
    ANGLE_BONUS_SCALE = 90,
    AIM_TIMING_THRESHOLD = 107,
    SPEED_ANGLE_BONUS_BEGIN = 5 * Math.PI / 6,
    AIM_ANGLE_BONUS_BEGIN = Math.PI / 3,
    SINGLETAP_THRESHOLD = 125;

export default function calculateDifficulty(beatmap: OsuBeatmap) {
    let objects = initObjects(beatmap);

    let speed = calculateIndividual(0, objects, beatmap.Stats.speedMultiplier);
    let aim = calculateIndividual(1, objects, beatmap.Stats.speedMultiplier);

    aim = Math.sqrt(aim) * STAR_SCALING_FACTOR;
    speed = Math.sqrt(speed) * STAR_SCALING_FACTOR;

    let total = aim + speed + Math.abs(speed - aim) * 0.5;

    return new OsuDifficulty(total, [aim, speed]);
}

function vectorNormalizer(cs: number) {
    let radius = (PLAYFIELD_SIZE.X / 16) *
        (1 - 0.7 * (cs - 5) / 5);
    let scalingFactor = 52 / radius;

    if(radius < CS_BUFF_THRESHOLD)
        scalingFactor *= 1 + Math.min(CS_BUFF_THRESHOLD - radius, 5) / 50;

    return new Vector(scalingFactor);
}

function initObjects(beatmap: OsuBeatmap): OsuDifficultyHitObject[] {
    let scalingVector = vectorNormalizer(beatmap.Stats.CS);
    let normalizedCenter = PLAYFIELD_CENTER.mul(scalingVector);

    let objects: OsuDifficultyHitObject[] = beatmap.HitObjects.map(object => ({
        object,
        strains: [0, 0],
        normPos: new Vector(),
        angle: 0,
        single: false,
        dist: 0
    }));
    
    for(let i = 0; i < beatmap.HitObjects.length; i++) {
        let { object } = objects[i];
        if(object.Type & HitObjectType.Spinner)
            objects[i].normPos = normalizedCenter.Copy;
        else
            objects[i].normPos = scalingVector.mul(object.X, object.Y);
        if(i >= 2) {
            let prev1 = objects[i - 1];
            let prev2 = objects[i - 2];
            let v1 = prev2.normPos.sub(prev1.normPos);
            let v2 = objects[i].normPos.sub(prev1.normPos);
            let dot = v1.dot(v2);
            let det = v1.X * v2.Y - v1.Y * v2.X;
            objects[i].angle = Math.abs(Math.atan2(det, dot));
        } else
            objects[i].angle = null;
    }

    return objects;
}

function spacingWeight(type: number, distance: number, delta: number, prevDistance: number, prevDelta: number, angle: number) {
    let strainTime = Math.max(delta, 50);
    if(type) { // DIFF_AIM
        let prevStrainTime = Math.max(prevDelta, 50),
            result = 0;
        if(angle !== null && angle > AIM_ANGLE_BONUS_BEGIN) {
            let angleBonus = Math.sqrt(
                Math.max(prevDistance - ANGLE_BONUS_SCALE, 0) *
                Math.pow(Math.sin(angle - AIM_ANGLE_BONUS_BEGIN), 2) *
                Math.max(distance - ANGLE_BONUS_SCALE, 0)
            );
            result = 1.5 * Math.pow(Math.max(0, angleBonus), 0.99) / 
                Math.max(AIM_TIMING_THRESHOLD, prevStrainTime);
        }
        let weightedDistance = Math.pow(distance, 0.99);
        return Math.max(
            result +
            weightedDistance / Math.max(AIM_TIMING_THRESHOLD, strainTime),
            weightedDistance / strainTime
        );
    } else { // DIFF_SPEED
        distance = Math.min(distance, SINGLE_SPACING);
        delta = Math.max(delta, MAX_SPEED_BONUS);
        let speedBonus = 1;
        if(delta < MIN_SPEED_BONUS)
            speedBonus += Math.pow((MIN_SPEED_BONUS - delta) / 40, 2);
        let angleBonus = 1;
        if(angle !== null && angle < SPEED_ANGLE_BONUS_BEGIN) {
            let s = Math.sin(1.5 * (SPEED_ANGLE_BONUS_BEGIN - angle));
            angleBonus += Math.pow(s, 2) / 3.57;
            if(angle < Math.PI / 2) {
                angleBonus = 1.28;
                if(distance < ANGLE_BONUS_SCALE && angle < Math.PI / 4)
                    angleBonus += (1 - angleBonus) *
                        Math.min((ANGLE_BONUS_SCALE - distance) / 10, 1);
                else if(distance < ANGLE_BONUS_SCALE)
                    angleBonus += (1 - angleBonus) *
                        Math.min((ANGLE_BONUS_SCALE - distance) / 10, 1) *
                        Math.sin((Math.PI / 2 - angle) * 4 / Math.PI);
            }
        }
        return (
            (1 + (speedBonus - 1) * 0.75) * angleBonus *
            (0.95 + speedBonus * Math.pow(distance / SINGLE_SPACING, 3.5))
        ) / strainTime;
    }
}

function calculateStrain(type: number, current: OsuDifficultyHitObject, previous: OsuDifficultyHitObject, timeScale: number) {
    let value = 0,
        decay = Math.pow(DECAY_BASE[type], current.object.DeltaTime / 1e3);

    if(current.object.Type & (HitObjectType.Note | HitObjectType.Slider)) {
        let dist = current.normPos.sub(previous.normPos).Length;
        current.dist = dist;
        if(!type)
            current.single = dist > SINGLE_SPACING;
        value = spacingWeight(type, dist, current.object.DeltaTime, previous.dist, previous.object.DeltaTime, current.angle);
        value *= WEIGHT_SCALING[type];
    }

    current.strains[type] = previous.strains[type] * decay + value;
}

function calculateIndividual(type: number, objects: OsuDifficultyHitObject[], timeScale: number) {
    let strains = [];
    let strainStep = STRAIN_STEP * timeScale;
    let interval = Math.ceil(objects[0].object.StartTime / strainStep) * strainStep;
    let maxStrain = 0;

    for(let i = 0; i < objects.length; i++) {
        if(i > 0) {
            calculateStrain(type, objects[i], objects[i - 1], timeScale);
        }
        while(objects[i].object.StartTime > interval) {
            strains.push(maxStrain);
            if(i > 0) {
                let decay = Math.pow(DECAY_BASE[type],
                    (interval - objects[i - 1].object.StartTime) / 1e3);
                maxStrain = objects[i - 1].strains[type] * decay;
            } else maxStrain = 0;
            interval += strainStep;
        }
        maxStrain = Math.max(maxStrain, objects[i].strains[type]);
    }

    strains.push(maxStrain);

    let weight = 1,
        difficulty = 0;

    strains.sort((a, b) => b - a);

    for(let strain of strains) {
        difficulty += strain * weight;
        weight *= DECAY_WEIGHT;
    }

    return difficulty;
}

export class OsuDifficulty extends Difficulty {
    calculatePP(score: any): number {
        return 0;
    }
}