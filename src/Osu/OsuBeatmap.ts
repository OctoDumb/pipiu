import Beatmap, { BeatmapStats } from '../Beatmap';
import OsuCalculator from './OsuDifficulty';
import { BeatmapData } from '../Parser';
import { Round } from '../Util';
import OsuHitObject from './HitObjects/OsuHitObject';
import Mods from '../Mods';

class OsuStats extends BeatmapStats {
    applyMods(mods: Mods) {
        //
    }

    ODToHitWindow(od: number): number {
        return 80 - 6 * od;
    }

    HitWindowToOD(hitWindow: number): number {
        return (80 - hitWindow) / 6;
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
            let obj = new OsuHitObject(o);
            lastObject = obj;
            return obj;
        });
    }

    GetBeatmapWithMods(mods: Mods) {
        return this;
    }

    CalculateDifficulty(timeScale?: number) {
        let data = new OsuCalculator(this).calculate([], 1);
        return data;
    }
}