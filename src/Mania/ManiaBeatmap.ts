import Beatmap, { BeatmapStats, BeatmapBPM, TimingPoint } from "../Beatmap";
import { BeatmapData } from "../Parser";
import { ApplyTimeScaling } from "../Util";
import ManiaHitObject from "./HitObjects/ManiaHitObject";
import ManiaCalculator from "./ManiaDifficulty";
import Mods from "../Mods";

class ManiaStats extends BeatmapStats {
    applyMods(mods: Mods) {
        //
    }

    ODToHitWindow(od: number) {
        return 34 + 3 * od;
    }

    HitWindowToOD(hitWindow: number) {
        return (hitWindow - 34) / 3;
    }

    toString() {
        return ``;
    }
}

export default class ManiaBeatmap extends Beatmap {
    Artist: string;
    Title: string;
    Creator: string;
    Version: string;
    Tags: string[];
    ID: number;
    SetID: number;
    Stats: ManiaStats;
    BPM: BeatmapBPM;
    TimingPoints: TimingPoint[];
    HitObjects: ManiaHitObject[] = [];
    constructor(data: BeatmapData) {
        super(data);

        this.Stats = new ManiaStats(data);

        for(let obj of data.objects) {
            this.HitObjects.push(new ManiaHitObject(obj, this.Stats.CS));
        }
    }

    CalculateDifficulty(/* timeScale?: number = 1 */) {
        const data = new ManiaCalculator(this).calculate([], 1);
        return data;
    }

    GetBeatmapWithMods(mods: Mods): ManiaBeatmap {
        let map = this;
        
        ApplyTimeScaling.bind(map)(mods);

        return map;
    }
}