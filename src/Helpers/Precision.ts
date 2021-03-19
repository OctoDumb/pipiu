export default class Precicion {
    private static FLOAT_EPSILON: number = 1e-3;

    private static DOUBLE_EPSILON: number = 1e-7;

    static definitelyBigger(
        v1: number, 
        v2: number, 
        acceptableDifference: number,
    ): boolean {
        if (!acceptableDifference) acceptableDifference = this.DOUBLE_EPSILON;
        return v1 - acceptableDifference > v2;
    }

    static almostBigger(
        v1: number, 
        v2: number, 
        acceptableDifference: number,
    ): boolean {
        if (!acceptableDifference) acceptableDifference = this.DOUBLE_EPSILON;
        return v1 > v2 - acceptableDifference;
    }

    static almostEquals(
        v1: number, 
        v2: number, 
        acceptableDifference: number,
    ): boolean {
        if (!acceptableDifference) acceptableDifference = this.DOUBLE_EPSILON;
        return Math.abs(v1 - v2) <= acceptableDifference;
    }
}