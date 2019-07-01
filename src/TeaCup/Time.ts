import {Task} from "./Task";
import {ok, Result} from "./Result";

/**
 * Simple module for getting current time and handling setTimeout
 */
export class Time {

    /**
     * Task that returns the current time
     */
    static now(): Task<never,number>  {
        return new TimeTask();
    }

    /**
     * Task that fires in specified time
     */
    static in(timeout: number): Task<never,number> {
        return new InTask(timeout)
    }

}

function now(): number {
    return new Date().getTime();
}

class TimeTask extends Task<never,number> {
    execute(callback: (r: Result<never, number>) => void): void {
        callback(ok(now()));
    }
}

class InTask extends Task<never, number> {

    private readonly t: number;

    constructor(timeout: number) {
        super();
        this.t = timeout;
    }

    execute(callback: (r: Result<never, number>) => void): void {
        setTimeout(() => callback(ok(now())), this.t)
    }

}
