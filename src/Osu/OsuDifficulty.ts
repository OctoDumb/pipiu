import Difficulty from '../Difficulty';
import OsuHitObject from './OsuHitObject';
import OsuBeatmap from './OsuBeatmap';
import Vector from '../Vector';
import { HitObjectType } from '../HitObject';
import { DifficultyCalculator } from '../DifficultyCalculator';

interface OsuDifficultyHitObject {
    object: OsuHitObject;
    strains: [number, number];
    normPos: Vector;
    angle: number;
    single: boolean;
    dist: number;
}

export default function calculateDifficulty(beatmap: OsuBeatmap): OsuDifficulty {
    return new OsuCalculator(beatmap).diff;
}

class OsuCalculator extends DifficultyCalculator{
    private readonly SINGLE_SPACING = 125;
    private readonly STRAIN_DECAY_BASE = [ 0.3, 0.15 ];
    private readonly WEIGHT_SCALING = [ 1400, 26.25 ];
    private readonly CS_BUFF_THRESHOLD = 30;
    private readonly PLAYFIELD_SIZE = new Vector(512, 384);
    private readonly PLAYFIELD_CENTER = this.PLAYFIELD_SIZE.mul(0.5);
    private readonly MIN_SPEED_BONUS = 75;
    private readonly MAX_SPEED_BONUS = 45;
    private readonly ANGLE_BONUS_SCALE = 90;
    private readonly AIM_TIMING_THRESHOLD = 107;
    private readonly SPEED_ANGLE_BONUS_BEGIN = 5 * Math.PI / 6;
    private readonly AIM_ANGLE_BONUS_BEGIN = Math.PI / 3;
    protected readonly STAR_SCALING_FACTOR = 0.0675;

    private timeScale: number;

    private objects: OsuDifficultyHitObject[];

    public readonly diff: OsuDifficulty;

    constructor(
        private readonly beatmap: OsuBeatmap
    ) {
        super();
        this.timeScale = beatmap.Stats.speedMultiplier;
        this.initObjects();

        let speed: number = this.calcDifficulty(this.calcHighestStrains(0));
        let aim: number = this.calcDifficulty(this.calcHighestStrains(1));
        
        aim = Math.sqrt(aim) * this.STAR_SCALING_FACTOR;
        speed = Math.sqrt(speed) * this.STAR_SCALING_FACTOR;

        let total = aim + speed + Math.abs(speed - aim) * 0.5;

        this.diff = new OsuDifficulty(total, [aim, speed]);
    }

    protected initObjects() {
        let scalingVector = this.vectorNormalizer(this.beatmap.Stats.CS);
        let normalizedCenter = this.PLAYFIELD_CENTER.mul(scalingVector);

        let objects: OsuDifficultyHitObject[] = this.beatmap.HitObjects.map(object => ({
            object,
            strains: [0, 0],
            normPos: new Vector(),
            angle: 0,
            single: false,
            dist: 0
        }));
        
        for(let i = 0; i < this.beatmap.HitObjects.length; i++) {
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

        this.objects = objects;
    }

    private spacingWeight(
        type: number, 
        distance: number, 
        delta: number, 
        prevDistance: number, 
        prevDelta: number, 
        angle: number
    ): number {
        let strainTime = Math.max(delta, 50);
        if(type) { // DIFF_AIM
            let prevStrainTime = Math.max(prevDelta, 50),
                result = 0;
            if(angle !== null && angle > this.AIM_ANGLE_BONUS_BEGIN) {
                let angleBonus = Math.sqrt(
                    Math.max(prevDistance - this.ANGLE_BONUS_SCALE, 0) *
                    Math.pow(Math.sin(angle - this.AIM_ANGLE_BONUS_BEGIN), 2) *
                    Math.max(distance - this.ANGLE_BONUS_SCALE, 0)
                );
                result = 1.5 * Math.pow(Math.max(0, angleBonus), 0.99) / 
                    Math.max(this.AIM_TIMING_THRESHOLD, prevStrainTime);
            }
            let weightedDistance = Math.pow(distance, 0.99);
            return Math.max(
                result +
                weightedDistance / Math.max(this.AIM_TIMING_THRESHOLD, strainTime),
                weightedDistance / strainTime
            );
        } else { // DIFF_SPEED
            distance = Math.min(distance, this.SINGLE_SPACING);
            delta = Math.max(delta, this.MAX_SPEED_BONUS);
            let speedBonus = 1;
            if(delta < this.MIN_SPEED_BONUS)
                speedBonus += Math.pow((this.MIN_SPEED_BONUS - delta) / 40, 2);
            let angleBonus = 1;
            if(angle !== null && angle < this.SPEED_ANGLE_BONUS_BEGIN) {
                let s = Math.sin(1.5 * (this.SPEED_ANGLE_BONUS_BEGIN - angle));
                angleBonus += Math.pow(s, 2) / 3.57;
                if(angle < Math.PI / 2) {
                    angleBonus = 1.28;
                    if(distance < this.ANGLE_BONUS_SCALE && angle < Math.PI / 4)
                        angleBonus += (1 - angleBonus) *
                            Math.min((this.ANGLE_BONUS_SCALE - distance) / 10, 1);
                    else if(distance < this.ANGLE_BONUS_SCALE)
                        angleBonus += (1 - angleBonus) *
                            Math.min((this.ANGLE_BONUS_SCALE - distance) / 10, 1) *
                            Math.sin((Math.PI / 2 - angle) * 4 / Math.PI);
                }
            }
            return (
                (1 + (speedBonus - 1) * 0.75) * angleBonus *
                (0.95 + speedBonus * Math.pow(distance / this.SINGLE_SPACING, 3.5))
            ) / strainTime;
        }
    }

    private vectorNormalizer(cs: number) {
        let radius = (this.PLAYFIELD_SIZE.X / 16) *
            (1 - 0.7 * (cs - 5) / 5);
        let scalingFactor = 52 / radius;
    
        if(radius < this.CS_BUFF_THRESHOLD)
            scalingFactor *= 1 + Math.min(this.CS_BUFF_THRESHOLD - radius, 5) / 50;
    
        return new Vector(scalingFactor);
    }

    private calculateStrain(
        type: number, 
        current: OsuDifficultyHitObject, 
        prev: OsuDifficultyHitObject, 
        timeScale: number = 1
    ) {
        let value = 0,
            decay = Math.pow(this.STRAIN_DECAY_BASE[type], current.object.DeltaTime / 1e3);
    
        if(current.object.Type & (HitObjectType.Note | HitObjectType.Slider)) {
            let dist = current.normPos.sub(prev.normPos).Length;
            current.dist = dist;
            if(!type)
                current.single = dist > this.SINGLE_SPACING;
            value = this.spacingWeight(type, dist, current.object.DeltaTime, prev.dist, prev.object.DeltaTime, current.angle);
            value *= this.WEIGHT_SCALING[type];
        }
    
        current.strains[type] = prev.strains[type] * decay + value;
    }

    protected calcHighestStrains(type: number): number[] {
        let objects: OsuDifficultyHitObject[] = this.objects;

        let sectionLen: number = 400 * this.timeScale;
        let curSectionEnd: number = Math.ceil(objects[0].object.StartTime / sectionLen) * sectionLen;
        let curSectionPick: number = 0;
        let highestStrains: number[] = [];

        let prev: OsuDifficultyHitObject = null;

        for(let o of objects) {
            if(prev) {
                this.calculateStrain(type, o, prev, this.timeScale);
            }
            while(o.object.StartTime > curSectionEnd) {
                highestStrains.push(curSectionPick);
                
                if (!prev) curSectionPick = 0;
                else {
                    let decay = Math.pow(this.STRAIN_DECAY_BASE[type], (curSectionEnd - prev.object.StartTime) / 1e3);
                    curSectionPick = prev.strains[type] * decay;
                }

                curSectionEnd += sectionLen;
            }
            curSectionPick = Math.max(curSectionPick, o.strains[type]);

            prev = o;
        }

        highestStrains.push(curSectionPick);

        return highestStrains.sort((a, b) => b - a);
    }
}

export class OsuDifficulty extends Difficulty {
    calculatePP(score: any): number {
        return 0;
    }
}