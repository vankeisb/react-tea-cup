import {Task} from './Task'

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
        return Task.succeed(randomIntFromInterval(lo, hi));
    }

}


function randomIntFromInterval(min: number,max: number)  {// min and max included
    return Math.floor(Math.random()*(max-min+1)+min);
}