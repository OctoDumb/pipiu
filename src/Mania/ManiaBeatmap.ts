import Beatmap, { BeatmapStats, BeatmapBPM, TimingPoint } from "../Beatmap";
import { BeatmapData } from "../Parser";
import { ApplyTimeScaling } from "../Util";
import ManiaHitObject from "./ManiaHitObject";
import Calculate from "./ManiaDifficulty";
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

        let lastObj = [];

        for(let obj of data.objects) {
            let column = Math.floor(obj.x / 512 * this.Stats.CS);
            if(!lastObj[column]) {
                this.HitObjects.push(new ManiaHitObject(obj, 0, this.Stats.CS));
            } else {
                this.HitObjects.push(new ManiaHitObject(obj, obj.startTime - lastObj[column], this.Stats.CS));
            }
            lastObj[column] = this.HitObjects[this.HitObjects.length - 1].EndTime;
        }
    }

    CalculateDifficulty(timeScale: number = 1) {
        return Calculate(this, timeScale);
    }

    GetBeatmapWithMods(mods: Mods): ManiaBeatmap {
        let map = this;
        
        ApplyTimeScaling.bind(map)(mods);

        return map;
    }
}