import Beatmap, { BeatmapStats } from '../Beatmap';
import { TaikoDifficulty } from './TaikoDifficulty';
import { BeatmapData } from '../Parser';
import { ApplyTimeScaling, Round } from '../Util';
import TaikoHitObject from './TaikoHitObject';
import calculateDifficulty from './TaikoDifficulty';
import Mods from '../Mods';

class TaikoStats extends BeatmapStats {
    applyMods(mods: Mods) {
        if(mods & Mods.EZ) {
            this.OD *= 0.5;
            this.CS *= 0.5;
        }
        if(mods & Mods.HR) {
            this.OD *= 1.4;
            this.CS *= 1.4;
        }
        this.OD = Math.min(this.OD, 10);
        this.CS = Math.min(this.CS, 10);
    }

    ODToHitWindow(od: number): number {
        return 20 + 3 * od;
    }

    HitWindowToOD(hitWindow: number): number {
        return (hitWindow - 20) / 3;
    }

    toString() {
        return `CS:${Round(this.CS)} OD:${Round(this.OD)} HP:${Round(this.HP)}`;
    }
}

export default class TaikoBeatmap extends Beatmap {
    HitObjects: TaikoHitObject[];
    Stats: TaikoStats;
    constructor(data: BeatmapData) {
        super(data);

        this.Stats = new TaikoStats(data);

        let lastObj: TaikoHitObject;

        this.HitObjects = data.objects.map(o => {
            let delta = o.startTime - (lastObj?.EndTime ?? lastObj?.StartTime ?? o.startTime);
            lastObj = new TaikoHitObject(o, delta, this);
            return lastObj;
        });
    }
    CalculateDifficulty(timeScale: number): TaikoDifficulty {
        return calculateDifficulty(this, timeScale);
    }

    GetBeatmapWithMods(mods: Mods): TaikoBeatmap {
        let map = this;
        
        ApplyTimeScaling.bind(map)(mods);

        return map;
    }
}