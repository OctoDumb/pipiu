import { HitObjectType } from './HitObject';

export interface BeatmapData {
    osuVersion: number,
    artist: string,
    title: string,
    creator: string,
    version: string,
    tags: string[],
    mode: number,
    id: number,
    setId: number,
    ar: number,
    cs: number,
    hp: number,
    od: number,
    slidermul: number,
    slidertr: number,
    bpmmin: number,
    bpmmax: number,
    timingpoints: DataTimingPoint[],
    objects: DataHitObject[]
}

export interface DataTimingPoint {
    offset: number,
    velocity?: number,
    bpm?: number,
    kiai: boolean
}

export interface DataHitObject {
    x: number,
    y: number,
    startTime: number,
    newCombo: boolean,
    type: number,
    other: string[],
    raw: string[]
}

const regex = {
    category: /^\[(?<cat>[a-zA-Z0-9]+)\]$/,
    string: /^(?<name>[a-zA-Z0-9]+)\s*:\s*(?<value>.*)$/
};

export default function BeatmapParser(content: string | Buffer): BeatmapData {
    const strings = content.toString().split(/[\n\r]+/).map(s => s.trim());
    let category = "";
    let data: BeatmapData = {
        osuVersion: 0,
        artist: "",
        title: "",
        creator: "",
        version: "",
        tags: [],
        mode: 0,
        id: 0,
        setId: 0,
        ar: 5,
        cs: 5,
        hp: 5,
        od: 5,
        slidermul: 0,
        slidertr: 0,
        bpmmin: Number.MAX_VALUE,
        bpmmax: 0,
        timingpoints: [],
        objects: []
    };

    function parseString(string: string) {
        if(!string) return;
        let p;
        switch(category) {
            case "general":
                p = string.match(regex.string).groups
                if(p.name == "Mode") data.mode = Number(p.value);
                break;
            
            case "metadata":
                p = string.match(regex.string).groups
                if(p.name == "Title") data.title = p.value;
                if(p.name == "Artist") data.artist = p.value;
                if(p.name == "Creator") data.creator = p.value;
                if(p.name == "Version") data.version = p.value;
                if(p.name == "Tags") data.tags = p.value.split(" ");
                if(p.name == "BeatmapID") data.id = Number(p.value);
                if(p.name == "BeatmapSetID") data.setId = Number(p.value);
                break;

            case "difficulty":
                p = string.match(regex.string).groups
                if(p.name == "HPDrainRate") data.hp = Number(p.value);
                if(p.name == "CircleSize") data.cs = Number(p.value);
                if(p.name == "OverallDifficulty") data.od = Number(p.value);
                if(p.name == "ApproachRate") data.ar = Number(p.value);
                if(p.name == "SliderMultiplier") data.slidermul = Number(p.value);
                if(p.name == "SliderTickRate") data.slidertr = Number(p.value);
                break;

            case "timingpoints":
                let m = string.split(",");
                let timingPoint: DataTimingPoint = {
                    offset: Number(m[0]),
                    kiai: m[7] == "1"
                };
                let beatLength = Number(m[1]);
                if(!isNaN(beatLength) && beatLength != 0) {
                    if(beatLength > 0) {
                        let bpm = Math.round(6e4 / beatLength * 100) / 100;
                        data.bpmmin = Math.min(data.bpmmin, bpm);
                        data.bpmmax = Math.max(data.bpmmax, bpm);
                        timingPoint.bpm = bpm;
                    } else {
                        timingPoint.velocity = Math.abs(100 / beatLength);
                    }
                }
                data.timingpoints.push(timingPoint);
                break;

            case "hitobjects":
                if(string.length < 4) break;
                let split = string.split(",");
                let obj: DataHitObject = {
                    x: Number(split[0]),
                    y: Number(split[1]),
                    startTime: Number(split[2]),
                    type: Number(split[3]),
                    newCombo: Boolean(Number(split[2]) & HitObjectType.NewCombo),
                    other: split.slice(4),
                    raw: split
                };
                data.objects.push(obj);
                break;

            default:
                let versionRegex = /osu file version v([\d*])/;
                if(versionRegex.test(string)) {
                    data.osuVersion = Number(string.match(versionRegex)[0]);
                }
        }
    }

    for(let string of strings) {
        if(regex.category.test(string))
            category = string.match(regex.category).groups.cat.toLowerCase();
        else
            parseString(string);
    }

    data.objects = data.objects.sort((a, b) => a.startTime - b.startTime);

    return data;
}