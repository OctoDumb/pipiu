import Vector from "../Vector";
import { SLIDER_QUALITY } from "./CatchConstants";
import { cpn, pointAtDistance, catmull, pointOnLine } from "./MathHelper";

export interface SliderTick {
    x: number;
    y: number;
    time: number;
}

export default abstract class Slider {
    pos: Vector[] = [];
    abstract pointAtDistance(length: number): Vector;
}

export class Linear extends Slider {
    constructor(points: Vector[]) {
        super();

        this.pos = points;
    }

    pointAtDistance(length: number): Vector {
        return pointOnLine(this.pos[0], this.pos[1], length);
    }
}

export class Bezier extends Slider {
    points: Vector[];
    order: number;
    constructor(points: Vector[]) {
        super();

        this.points = points;
        this.order = points.length;
        this.calculatePoints();
    }

    calculatePoints() {
        let subPoints: Vector[] = [];
        for(let i = 0; i < this.points.length; i++) {
            if(i == this.points.length - 1) {
                subPoints.push(this.points[i]);
                this.bezier(subPoints);
                subPoints = [];
            } else if(subPoints.length > 1 && this.points[i].equal(subPoints[subPoints.length - 1])) {
                this.bezier(subPoints);
                subPoints = [];
            }

            subPoints.push(this.points[i]);
        }
    }

    bezier(points: Vector[]) {
        let order = points.length,
            step = 0.25 / SLIDER_QUALITY / order,
            i = 0,
            n = order - 1;
        
        while(i < 1 + step) {
            let x = 0,
                y = 0;

            for(let p = 0; p < n + 1; p++) {
                let a = cpn(p, n) * Math.pow(1 - i, n - p) * Math.pow(i, p);
                x += a * points[i].X;
                y += a * points[i].Y;
            }

            this.pos.push(new Vector(x, y));
            i += step;
        }
    }

    pointAtDistance(length: number) {
        return pointAtDistance(this.pos, length);
    }
}

export class Catmull extends Slider {
    points: Vector[];
    order: number;
    step: number = 2.5 / SLIDER_QUALITY;
    constructor(points: Vector[]) {
        super();

        this.points = points;
        this.order = points.length;
        this.calcPoints();
    }

    calcPoints() {
        for(let x = 0; x < this.order - 1; x++) {
            let t = 0;
            while(t < this.step + 1) {
                let v1 = this.points[x >= 1 ? x - 1 : x];
                let v2 = this.points[x];
                let v3 = x + 1 < this.order ? this.points[x + 1] : v2.calc(1, v2.calc(-1, v1));
                let v4 = x + 2 < this.order ? this.points[x + 2] : v3.calc(1, v3.calc(-1, v2));

                let point = getPoint([v1, v2, v3, v4], t);
                this.pos.push(point);
                t += this.step;
            }
        }
    }

    pointAtDistance(length: number) {
        return pointAtDistance(this.pos, length);
    }
}

export class Perfect extends Slider {
    points: Vector[];
    cx: number;
    cy: number;
    radius: number;
    
    constructor(points: Vector[]) {
        super();

        this.points = points;
        this.setupPath();
    }
    
    setupPath() {
        let d = getCircleCircumference(this.points);
        this.cx = d[0];
        this.cy = d[1];
        this.radius = d[2];
        if (isLeft(this.points))
            this.radius *= -1;
    }

    pointAtDistance(length: number): Vector {
        let radians = length / this.radius;
        return rotate(this.cx, this.cy, this.points[0], radians);
    }
}

function getPoint(p: Vector[], length: number): Vector {
    let x = catmull(p.map(v => v.X), length);
    let y = catmull(p.map(v => v.Y), length);

    return new Vector(x, y);
}

function getCircleCircumference(p: Vector[]): number[] {
    let d = 2 * (p[0].X * (p[1].Y - p[2].Y) + p[1].Y * (p[2].Y - p[0].Y) + p[2].X * (p[0].Y - p[1].Y));
    
    if (d === 0) 
        throw "Invalid circle! Unable to chose angle.";

    let ux = ((Math.pow(p[0].X, 2) + Math.pow(p[0].Y, 2)) * (p[1].Y - p[2].Y) + (Math.pow(p[1].X, 2) + Math.pow(p[1].Y, 2)) * (p[2].Y - p[0].Y) + (Math.pow(p[2].X, 2) + Math.pow(p[2].Y, 2)) * (p[0].Y - p[1].Y)) / d;
    let uy = ((Math.pow(p[0].X, 2) + Math.pow(p[0].Y, 2)) * (p[2].X - p[1].X) + (Math.pow(p[1].X, 2) + Math.pow(p[1].X, 2)) * (p[0].X - p[2].X) + (Math.pow(p[2].X, 2) + Math.pow(p[2].Y, 2)) * (p[1].X - p[0].X)) / d;

    let r = Math.sqrt(
        Math.pow(ux - p[0].X, 2) + Math.pow(uy - p[0].Y, 2)
    );

    return [ux, uy, r]
}

function isLeft(p: Vector[]): boolean {
    return ((p[1].X - p[0].X) * (p[2].Y - p[0].Y) - (p[1].Y - p[0].Y) * (p[2].X - p[0].X)) < 0
}

function rotate(cx: number, cy: number, p: Vector, radians: number) {
    let cos = Math.cos(radians);
    let sin = Math.sin(radians);
    
    return new Vector(
        cos * (p.X - cx) - sin * (p.Y - cy) + cx,
        sin * (p.X - cx) + cos * (p.Y - cy) + cy
    );
}