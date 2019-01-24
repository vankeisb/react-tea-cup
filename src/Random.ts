import {Task} from './Task'
import {Ok, Result} from "./Result";


export function random(lo: number, hi: number): Task<void, number> {
    return new RandomTask(lo, hi)
}


class RandomTask extends Task<void, number> {

    readonly lo:number;
    readonly hi:number;

    constructor(lo: number, hi: number) {
        super();
        this.lo = lo;
        this.hi = hi;
    }

    run(): Promise<Result<void, number>> {
        return Promise.resolve(Ok<void,number>(randomIntFromInterval(this.lo, this.hi)));
    }


}

function randomIntFromInterval(min: number,max: number)  {// min and max included
    return Math.floor(Math.random()*(max-min+1)+min);
}