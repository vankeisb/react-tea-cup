import {Task} from './Task'

export class Random {

    static fromIntervalInclusive(lo: number, hi: number): Task<never, number> {
        return Task.succeed(randomIntFromInterval(lo, hi));
    }

}


function randomIntFromInterval(min: number,max: number)  {// min and max included
    return Math.floor(Math.random()*(max-min+1)+min);
}