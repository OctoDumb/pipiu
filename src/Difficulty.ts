export default abstract class Difficulty {
    starRating: number;
    additionalStarRating: number[] = [];

    constructor(stars: number, additional: number[] = []) {
        this.starRating = stars;
        this.additionalStarRating = additional;
    }

    abstract calculatePP?(score: any): number;
}