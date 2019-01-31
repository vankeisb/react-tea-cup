import {Cmd} from "./Cmd";
import {Dispatcher} from "./Dispatcher";
import {Err, Ok, Result} from "./Result";


export abstract class Task<E,R> {

    abstract execute(callback:(r:Result<E,R>) => void): void

    static attempt<E,R,M>(t:Task<E,R>, toMsg:(r:Result<E,R>) => M): Cmd<M> {
        return new TaskCmd(t, toMsg)
    }

    static perform<R,M>(t:Task<void,R>, toMsg:(r:R) => M): Cmd<M> {
        return new TaskNoErrCmd(t, toMsg)
    }

    static succeed<R>(r:R): Task<void,R> {
        return new TSuccess(r)
    }

    static fail<E>(e:E): Task<E, void> {
        return new TError(e)
    }

    map<R2>(f:(r:R) => R2): Task<E,R2> {
        return new TMapped(this, f)
    }
}


class TMapped<E,R,R2> extends Task<E,R2> {

    private readonly task: Task<E,R>;
    private readonly mapper: (r:R) => R2;

    constructor(task: Task<E, R>, mapper: (r: R) => R2) {
        super();
        this.task = task;
        this.mapper = mapper;
    }

    execute(callback: (r: Result<E, R2>) => void): void {
        this.task.execute((r:Result<E,R>) => {
            callback(r.map(this.mapper))
        })
    }
}


class TSuccess<R> extends Task<void,R> {

    private readonly result:R;

    constructor(result: R) {
        super();
        this.result = result;
    }

    execute(callback: (r: Result<void, R>) => void): void {
        callback(Ok(this.result));
    }
}


class TError<E> extends Task<E,void> {

    private readonly err:E;

    constructor(err: E) {
        super();
        this.err = err;
    }

    execute(callback: (r: Result<E, void>) => void): void {
        callback(Err(this.err))
    }
}


class TaskCmd<E,R,M> extends Cmd<M> {

    readonly task: Task<E,R>;
    readonly toMsg: (r:Result<E,R>) => M;

    constructor(task: Task<E, R>, toMsg: (r: Result<E, R>) => M) {
        super();
        this.task = task;
        this.toMsg = toMsg;
    }

    execute(dispatch: Dispatcher<M>): void {
        this.task.execute((r:Result<E,R>) => {
            dispatch(this.toMsg(r))
        });
    }
}


class TaskNoErrCmd<R,M> extends Cmd<M> {

    readonly task: Task<void,R>;
    readonly toMsg: (r:R) => M;

    constructor(task: Task<void, R>, toMsg: (r:R) => M) {
        super();
        this.task = task;
        this.toMsg = toMsg;
    }

    execute(dispatch: Dispatcher<M>): void {
        this.task.execute((r:Result<void,R>) => {
            if (!r.isOk()) {
                throw Error("got an error from a void task : " + r)
            }
            dispatch(this.toMsg(r.get()));
        })
    }
}

