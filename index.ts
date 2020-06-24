import Beatmap from "./src/Beatmap";
import parse from "./src/Parser";

import Mods from './src/Mods';

import OsuBeatmap from "./src/Osu/OsuBeatmap";
import TaikoBeatmap from "./src/Taiko/TaikoBeatmap";
import CatchBeatmap from "./src/Catch/CatchBeatmap";
import ManiaBeatmap from "./src/Mania/ManiaBeatmap";

export default function CreateBeatmap(content: string | Buffer): Beatmap {
    let parsed = parse(content);
    switch(parsed.mode) {
        case 0:
            return new OsuBeatmap(parsed);
        case 1:
            return new TaikoBeatmap(parsed);
        case 2:
            return new CatchBeatmap(parsed);
        case 3:
            return new ManiaBeatmap(parsed);
        default:
            throw "Unsupported gamemode";
    }
}

export { 
    Mods,

    Beatmap,

    OsuBeatmap,
    TaikoBeatmap,
    CatchBeatmap,
    ManiaBeatmap
};