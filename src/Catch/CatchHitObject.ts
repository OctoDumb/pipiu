import HitObject, { HitObjectType } from "../HitObject";
import { TimingPoint } from "../Beatmap";
import { DataHitObject } from "../Parser";
import CatchBeatmap from "./CatchBeatmap";
import Slider, { Bezier, Catmull, Linear, Perfect } from "./CatchSliders";
import Vector from "../Vector";

export class CatchSliderTick {
    X: number;
    Y: number;
    StartTime: number;
    constructor(pos: Vector, time: number) {
        this.X = pos.X;
        this.Y = pos.Y;
        this.StartTime = time;
    }
}

export default class CatchHitObject extends HitObject {
    X: number;
    Y: number;
    StartTime: number;
    EndTime: number;
    DeltaTime: number;
    Column: number;
    TimingPoint: TimingPoint;
    IsSlider: boolean;
    Repeat?: number;
    Length?: number;
    TickDistance?: number;
    Duration?: number;
    SliderType?: string;
    CurvePoints?: Vector[];
    Path?: Vector[];
    Ticks?: CatchSliderTick[];
    EndTicks?: CatchSliderTick[];

    constructor(data: DataHitObject, beatmap: CatchBeatmap) {
        super(data);
        this.TimingPoint = beatmap.getTimingPointAt(this.StartTime);
        this.IsSlider = Boolean(data.type & HitObjectType.Slider);
        if(this.IsSlider) {
            let curveSplit = data.other[1].split("|");
            let curvePoints: Vector[] = [];
            for(let i = 1; i < curveSplit.length; i++) {
                let vectorSplit = curveSplit[i].split(":");
                let vector = new Vector(Number(vectorSplit[0]), Number(vectorSplit[1]));
                curvePoints.push(vector);
            }

            if(curvePoints.length > 0) {
                this.Repeat = Number(data.other[2]);
                this.Length = Number(data.other[3]);

                this.Ticks = [];
                this.EndTicks = [];

                let tickDistance = 100 * beatmap.SliderMultiplier / beatmap.SliderTickRate;
                if(beatmap.OsuVersion >= 8)
                    tickDistance /= Math.max(10, Math.min(1000, 100 / this.TimingPoint.velocity)) / 100;

                this.TickDistance = tickDistance;

                this.Duration = (6e4 / this.TimingPoint.bpm * (this.Length / beatmap.SliderMultiplier * this.TimingPoint.velocity)) / 100 * this.Repeat;

                let sliderType = curveSplit[0];
                if(beatmap.OsuVersion <= 6 && curvePoints.length >= 2) {
                    if(sliderType == "L")
                        sliderType = "B";

                    if(curvePoints.length == 2) {
                        if((this.X == curvePoints[0].X && this.Y == curvePoints[0].Y) || curvePoints[0].equal(curvePoints[1])) {
                            curvePoints.shift();
                            sliderType = "L";
                        }
                    }
                }

                this.SliderType = sliderType;
                this.CurvePoints = [new Vector(this.X, this.Y), ...curvePoints];

                this.calculateSlider();
            } else this.IsSlider = false;
        }
    }

    calculateSlider(calculatePath = false) {
        if(this.SliderType == "P" && this.CurvePoints.length > 3)
            this.SliderType = "B";
        else if(this.CurvePoints.length == 2)
            this.SliderType = "L";

        let curve: Slider;

        if(this.SliderType == "P") {
            try {
                curve = new Perfect(this.CurvePoints);
            } catch(e) {
                curve = new Bezier(this.CurvePoints);
                this.SliderType = "B";
            }
        } else if(this.SliderType == "B")
            curve = new Bezier(this.CurvePoints);
        else if(this.SliderType == "C")
            curve = new Catmull(this.CurvePoints);
        else if(this.SliderType == "L")
            curve = new Linear(this.CurvePoints);

        if(calculatePath) {
            if(this.SliderType == "L")
                this.Path = curve.pos;
            else if(this.SliderType == "P") {
                this.Path = [];
                let l = 0;
                let step = 5;
                while(l <= this.Length) {
                    this.Path.push((curve.pointAtDistance(l)));
                    l += step;
                }
            } else if(this.SliderType == "B" || this.SliderType == "C")
                this.Path = curve.pos;
        }

        let currentDistance = this.TickDistance;
        let timeAdd = this.Duration * (this.TickDistance / (this.Length * this.Repeat));

        while(currentDistance < this.Length - this.TickDistance / 8) {
            let point = curve.pointAtDistance(currentDistance);

            this.Ticks.push(new CatchSliderTick(point, this.StartTime + timeAdd * (this.Ticks.length + 1)));
            currentDistance += this.TickDistance;
        }

        let repeatId = 1,
            repeatBonusTicks = [];

        while(repeatId < this.Repeat) {
            let dist = (1 & repeatId) * this.Length;
            let timeOffset = this.Duration / this.Repeat * repeatId;

            let point = curve.pointAtDistance(dist);

            this.EndTicks.push(new CatchSliderTick(point, this.StartTime + timeOffset));

            let repeatTicks = this.Ticks.slice(0);

            let normalizeTimeValue = this.StartTime;

            if(1 & repeatId) {
                repeatTicks.reverse();
                normalizeTimeValue += this.Duration / this.Repeat;
            }

            for(let tick of repeatTicks)
                tick.StartTime = this.StartTime + timeOffset + Math.abs(tick.StartTime - normalizeTimeValue);

            repeatBonusTicks.push(...repeatTicks);

            repeatId++;
        }

        this.Ticks.push(...repeatBonusTicks);

        let distEnd = (1 & this.Repeat) * this.Length;
        let point = curve.pointAtDistance(distEnd);

        this.EndTicks.push(new CatchSliderTick(point, this.StartTime + this.Duration));
    }

    getCombo(): number {
        let combo = 1;

        if(this.IsSlider)
            combo += this.Ticks.length + this.Repeat;

        return combo;
    }
}