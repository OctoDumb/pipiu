export abstract class DifficultyCalculator {
    protected readonly DECAY_WEIGHT: number = 0.9;

    protected abstract STAR_SCALING_FACTOR: number;

    protected abstract initObjects(): void;
    protected abstract calcHighestStrains(type?: number): number[];

    protected calcDifficulty(
        highestStrains: number[]
    ): number {
        let difficulty: number = 0,
            weight: number = 1;

        for(let strain of highestStrains) {
            difficulty += strain * weight;
            weight *= this.DECAY_WEIGHT;
        }

        return difficulty;
    }
}