export default class Vector {
    X: number;
    Y: number;
    constructor(x: number = null, y: number = null) {
        this.X = x == null ? 0 : x;
        this.Y = y == null ? x == null ? 0 : x : y;
    }

    equal(v: Vector): boolean {
        return this.X == v.X && this.Y == v.Y;
    }

    distance(v: Vector) {
        return Math.sqrt(
            Math.pow(this.X - v.X, 2) +
            Math.pow(this.Y - v.Y, 2)
        );
    }

    calc(val: number, v: Vector) {
        return new Vector(
            this.X + val * v.X,
            this.Y + val * v.Y
        )
    }

    sub(v: Vector) {
        return new Vector(
            this.X - v.X,
            this.Y - v.Y
        );
    }
    
    mul(v1: Vector | number, v2?: number) {
        if(typeof v1 == "number") {
            if(v2 !== undefined)
                return new Vector(this.X * v1, this.Y * v2);
            return new Vector(this.X * v1, this.Y * v1);
        }
        
        return new Vector(
            this.X * v1.X,
            this.Y * v1.Y
        );
    }

    dot(v: Vector) {
        return this.X * v.X + this.Y * v.Y;
    }

    get Copy() {
        return new Vector(this.X, this.Y)
    }

    get Length() {
        return Math.sqrt(this.X ** 2 + this.Y ** 2);
    }
}