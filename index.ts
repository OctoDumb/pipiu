import { readFileSync as read } from "fs";

import Beatmap from "./src/Beatmap";
import parse from "./src/Parser";

import Mods from './src/Mods';

import OsuBeatmap from "./src/Osu/OsuBeatmap";
/* import TaikoBeatmap from "./src/Taiko/TaikoBeatmap";
import CatchBeatmap from "./src/Catch/CatchBeatmap"; */
import ManiaBeatmap from "./src/Mania/ManiaBeatmap";

export default function CreateBeatmap(content: string | Buffer): Beatmap {
    let parsed = parse(content);
    switch(parsed.mode) {
        case 0:
            return new OsuBeatmap(parsed);
        /* case 1:
            return new TaikoBeatmap(parsed);
        case 2:
            return new CatchBeatmap(parsed); */
        case 3:
            return new ManiaBeatmap(parsed);
        default:
            throw "Unsupported gamemode";
    }
}

let map = CreateBeatmap(read(process.argv.slice(2).join(' ')));

console.log(`${map.Artist} - ${map.Title} [${map.Version}] by ${map.Creator}`);
console.log(map.Stats.toString());

let difficulty = map.CalculateDifficulty(1);

console.log(difficulty);

export { 
    Mods,

    Beatmap,

    OsuBeatmap,
/*     TaikoBeatmap,
    CatchBeatmap,
    ManiaBeatmap */
};