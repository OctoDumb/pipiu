import Beatmap, { BeatmapStats, BeatmapBPM, TimingPoint } from "../Beatmap";
import { BeatmapData } from "../Parser";
import { ApplyTimeScaling } from "../Util";
import CatchHitObject from "./CatchHitObject";
import { HitObjectType } from "../HitObject";
import Calculate from "./CatchDifficulty";
import Mods from "../Mods";

class CatchStats extends BeatmapStats {
    applyMods(mods: Mods) {
        //
    }

    ODToHitWindow(od: number) {
        return od;
    }

    HitWindowToOD(hitWindow: number) {
        return hitWindow;
    }

    toString() {
        return ``;
    }
}

export default class CatchBeatmap extends Beatmap {
    Artist: string;
    Title: string;
    Creator: string;
    Version: string;
    Tags: string[];
    ID: number;
    SetID: number;
    Stats: CatchStats;
    BPM: BeatmapBPM;
    TimingPoints: TimingPoint[];
    HitObjects: CatchHitObject[] = [];
    constructor(data: BeatmapData) {
        super(data);

        this.Stats = new CatchStats(data);

        this.HitObjects = data.objects.filter(obj => obj.type & (HitObjectType.Note | HitObjectType.Slider)).map(obj => new CatchHitObject(obj, this)).filter(o => o.X != undefined);
    }

    get maxCombo() {
        return this.HitObjects.map(obj => obj.getCombo()).reduce((a, b) => a + b);
    }

    CalculateDifficulty(timeScale: number = 1) {
        return Calculate(this, timeScale);
    }

    GetBeatmapWithMods(mods: Mods): CatchBeatmap {
        let map = this;
        
        ApplyTimeScaling.bind(map)(mods);

        return map;
    }
}