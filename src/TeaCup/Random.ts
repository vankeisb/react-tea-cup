import {Task} from './Task'
import {ok, Result} from "./Result";

/**
 * Generate Rantom numbers.
 */
export class Random {

    /**
     * Generate a random int between lo and hi
     * @param lo
     * @param hi
     */
    static fromIntervalInclusive(lo: number, hi: number): Task<never, number> {
        return new RandomTask(lo, hi);
    }

}


class RandomTask extends Task<never,number> {

    private readonly lo: number;
    private readonly hi: number;

    constructor(lo: number, hi: number) {
        super();
        this.lo = lo;
        this.hi = hi;
    }

    execute(callback: (r: Result<never, number>) => void): void {
        callback(ok(randomIntFromInterval(this.lo, this.hi)));
    }
}


function randomIntFromInterval(min: number,max: number)  {// min and max included
    return Math.floor(Math.random()*(max-min+1)+min);
}