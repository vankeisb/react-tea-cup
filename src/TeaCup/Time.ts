import {Task} from "./Task";
import {ok, Result} from "./Result";
import {Sub} from "./Sub";


const everySubs : Array<Array<EverySub<any>>> = [];
const everyIntervals: Array<number> = [];

function initIntervalForDelay(delay: number) {
    if (everyIntervals[delay] === undefined) {
        everyIntervals[delay] = setInterval(() => {
            const subs = everySubs[delay];
            if (subs) {
                subs.forEach(sub => sub.trigger())
            }
        }, delay)
    }
}

function cleanupIntervalForDelay(delay: number) {
    const handle = everyIntervals[delay];
    if (handle) {
        clearInterval(handle);
    }
}


class EverySub<M> extends Sub<M> {

    private readonly delay: number;
    private readonly toMsg: () => M;

    constructor(delay: number, toMsg: () => M) {
        super();
        this.delay = delay;
        this.toMsg = toMsg;
    }

    protected onInit() {
        super.onInit();
        let subsForDelay = everySubs[this.delay];
        if (subsForDelay === undefined) {
           subsForDelay = [];
           everySubs[this.delay] = subsForDelay;
        }
        subsForDelay.push(this);
        initIntervalForDelay(this.delay);
    }

    protected onRelease() {
        super.onRelease();
        let subsForDelay = everySubs[this.delay];
        if (subsForDelay !== undefined) {
            everySubs[this.delay] = subsForDelay.filter(s => s !== this);
            if (everySubs[this.delay].length === 0) {
                cleanupIntervalForDelay(this.delay);
                delete everySubs[this.delay];
            }
        }
    }

    trigger() {
        this.dispatch(this.toMsg());
    }
}



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

    static every<M>(delay: number, toMsg: (() => M)): Sub<M> {
        return new EverySub(delay, toMsg);
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
