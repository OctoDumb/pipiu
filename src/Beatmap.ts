import { DataTimingPoint, BeatmapData } from "./Parser";
import HitObject from "./HitObject";
import Difficulty from "./Difficulty";
import Mods from "./Mods";

export class TimingPoint {
    offset: number;
    kiai: boolean;
    bpm: number;
    velocity?: number;
    constructor(data: DataTimingPoint, bpm: number) {
        this.offset = data.offset;
        this.kiai = data.kiai;
        this.bpm = data.bpm || bpm;
        this.velocity = data.velocity || 1;
    }
}

export abstract class BeatmapStats {
    AR: number;
    CS: number;
    HP: number;
    OD: number;
    speedMultiplier = 1;
    mode: number;

    constructor(data: BeatmapData) {
        this.AR = data.ar;
        this.CS = data.cs;
        this.HP = data.hp;
        this.OD = data.hp;
    }

    applyTimeScaling(timeScale: number) {
        this.speedMultiplier *= timeScale;
    }

    get HitWindow() {
        return this.ODToHitWindow(this.OD);
    }

    abstract applyMods(mods: Mods): void;

    abstract ODToHitWindow(od: number): number;

    abstract HitWindowToOD(hitWindow: number): number;

    abstract toString(): string;
}

export class BeatmapBPM {
    Min: number;
    Max: number;
    constructor(min: number, max: number) { this.Min = min; this.Max = max; }
    toString() {
        return `${this.Min}${this.Min == this.Max ? '' : `-${this.Max}`}`;
    }
}

export default abstract class Beatmap {
    OsuVersion: number;
    Artist: string;
    Title: string;
    Creator: string;
    Version: string;
    Tags: string[];
    ID: number;
    SetID: number;
    Stats: BeatmapStats;
    SliderMultiplier: number;
    SliderTickRate: number;
    BPM: BeatmapBPM;
    TimingPoints: TimingPoint[];
    HitObjects: HitObject[];

    constructor(data: BeatmapData) {
        this.OsuVersion = data.osuVersion;

        this.Artist = data.artist;
        this.Title = data.title;

        this.Creator = data.creator;
        this.Version = data.version;

        this.Tags = data.tags;

        this.ID = data.id;
        this.SetID = data.setId;

        this.SliderMultiplier = data.slidermul;
        this.SliderTickRate = data.slidertr;

        this.BPM = new BeatmapBPM(data.bpmmin, data.bpmmax);

        let bpm = data.timingpoints[0].bpm;

        this.TimingPoints = data.timingpoints.map(d => {
            if(d.bpm) bpm = d.bpm;
            return new TimingPoint(d, bpm);
        });
    }

    abstract CalculateDifficulty(timeScale: number): Difficulty;

    abstract GetBeatmapWithMods(mods: Mods): Beatmap;

    getTimingPointAt(time: number): TimingPoint {
        return this.TimingPoints.filter(p => p.offset <= time).pop();
    }
}