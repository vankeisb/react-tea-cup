import {Cmd} from "./Cmd";
import {Dispatcher} from "./Dispatcher";
import {Err, Ok, Result} from "./Result";

export class Task<E,R> {

    readonly body: () => Promise<Result<E,R>>;

    constructor(body: () => Promise<Result<E, R>>) {
        this.body = body;
    }

    static attempt<E,R,M>(t:Task<E,R>, toMsg:(r:Result<E,R>) => M): Cmd<M> {
        return new TaskCmd(t, toMsg)
    }

    static perform<R,M>(t:Task<void,R>, toMsg:(r:R) => M): Cmd<M> {
        return new TaskNoErrCmd(t, toMsg)
    }

    static succeed<R>(r:R): Task<void,R> {
        return new Task<void, R>((() => Promise.resolve(Ok(r))))
    }

    static fail<E>(e:E): Task<E, void> {
        return new Task<E, void>(() => Promise.resolve(Err(e)))
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
        this.task.body().then(r => {
            dispatch(this.toMsg(r))
        })
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
        this.task.body().then(r => {
            if (!r.isOk()) {
                throw Error("got an error from a void task : " + r)
            }
            dispatch(this.toMsg(r.get()));
        });
    }


}

