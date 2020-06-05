import Beatmap, { BeatmapStats } from '../Beatmap';
import calculateDifficulty, { OsuDifficulty } from './OsuDifficulty';
import { BeatmapData } from '../Parser';
import { Round } from '../Util';
import OsuHitObject from './OsuHitObject';
import Mods from '../Mods';

class OsuStats extends BeatmapStats {
    applyMods(mods: Mods) {
        //
    }

    ODToHitWindow(od: number): number {
        return od;
    }

    HitWindowToOD(hitWindow: number): number {
        return hitWindow;
    }

    toString() {
        return `CS:${Round(this.CS)} AR:${Round(this.AR)} OD:${Round(this.OD)} HP:${Round(this.HP)}`;
    }
}

export default class OsuBeatmap extends Beatmap {
    HitObjects: OsuHitObject[];
    Stats: OsuStats;
    constructor(data: BeatmapData) {
        super(data);

        this.Stats = new OsuStats(data);

        let lastObject: OsuHitObject;

        this.HitObjects = data.objects.map(o => {
            let delta = lastObject ? o.startTime - lastObject.StartTime : 0;
            let obj = new OsuHitObject(o, delta);
            lastObject = obj;
            return obj;
        });
    }

    GetBeatmapWithMods(mods: Mods) {
        return this;
    }

    CalculateDifficulty(timeScale: number): OsuDifficulty {
        return calculateDifficulty(this);
    }
}