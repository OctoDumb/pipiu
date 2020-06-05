import Vector from "../Vector";

export function cpn(p, n) {
    if(p < 0 || p > n)
        return 0;
    p = Math.min(p, n - p);
    let out = 1;
    for(let i = 1; i < p + 1; i++)
        out = out * (n - p + i) / i;
    return out;
}

export function pointOnLine(p0: Vector, p1: Vector, length: number) {
    let fullLength = Math.sqrt(Math.pow(p1.X - p0.X, 2) + Math.pow(p1.Y - p0.Y, 2));
    let n = fullLength - length;

    if(fullLength == 0)
        fullLength = 1;

    return new Vector(
        (n * p0.X + length * p1.X) / fullLength,
        (n * p0.Y + length * p1.Y) / fullLength
    );
}

export function angleFromPoints(p0: Vector, p1: Vector) {
    return Math.atan2(p1.Y - p0.Y, p1.X - p0.X);
}

export function distanceFromPoints(array: Vector[]) {
    let distance = 0;

    for(let i = 1; i < array.length; i++)
        distance += array[i].distance(array[i - 1]);

    return distance;
}

export function cartFromPol(r: number, t: number) {
    return new Vector(
        r * Math.cos(t),
        r * Math.sin(t)
    );
}

export function pointAtDistance(array: Vector[], distance: number) {
    let i = 0,
        currentDistance = 0,
        newDistance = 0;

    if(array.length < 2)
        return new Vector();
    
    if(distance == 0)
        return array[0];

    if(distanceFromPoints(array) <= distance)
        return array[array.length - 1];

    for(i = 0; i < array.length - 2; i++) {
        let x = array[i].X - array[i + 1].X;
        let y = array[i].Y - array[i + 1].Y;

        newDistance = Math.sqrt(x * x + y * y);
        currentDistance += newDistance;

        if(distance <= currentDistance)
            break;
    }

    currentDistance -= newDistance;

    if(distance == currentDistance)
        return array[i];
    let angle = angleFromPoints(array[i], array[i + 1]);
    let cart = cartFromPol(distance - currentDistance, angle);

    if(array[i].X > array[i + 1].X)
        return new Vector(array[i].X - cart.X, array[i].Y - cart.Y);
    else
        return new Vector(array[i].X + cart.X, array[i].Y + cart.Y);
}

export function catmull(p: number[], length: number): number {
    return 0.5 * (
        (2 * p[1]) +
        (-p[0] + p[2]) * length +
        (2 * p[0] - 5 * p[1] + 4 * p[2] - p[3]) * Math.pow(length, 2) +
        (-p[0] + 3 * p[1] - 3 * p[2] + p[3]) * Math.pow(length, 3)
    );
}