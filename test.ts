import CreateBeatmap from ".";
import { readFileSync as read } from "fs";

let map = CreateBeatmap(read(process.argv.slice(2).join(' ')));

console.log(`${map.Artist} - ${map.Title} [${map.Version}] by ${map.Creator}`);
console.log(map.Stats.toString());

let difficulty = map.CalculateDifficulty(1);

console.log(difficulty);
