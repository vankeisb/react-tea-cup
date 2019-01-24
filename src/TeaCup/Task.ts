import {Cmd} from "./Cmd";
import {Dispatcher} from "./Dispatcher";
import {Result} from "./Result";

export abstract class Task<E,R> {

    abstract run(): Promise<Result<E,R>>;

    static attempt<E,R,M>(t:Task<E,R>, toMsg:(r:Result<E,R>) => M): Cmd<M> {
        return new TaskCmd(t, toMsg)
    }

    static perform<R,M>(t:Task<void,R>, toMsg:(r:R) => M): Cmd<M> {
        return new TaskNoErrCmd(t, toMsg)
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

    run(dispatch: Dispatcher<M>): void {
        this.task.run().then(r => {
            dispatch(this.toMsg(r))
        })
    }
}

class TaskNoErrCmd<R,M> extends Cmd<M> {

    readonly task: Task<void,R>;
    readonly toMsg: (r:R) => M;

    constructor(task: Task<void, R>, toMsg: (r: R) => M) {
        super();
        this.task = task;
        this.toMsg = toMsg;
    }

    run(dispatch: Dispatcher<M>): void {
        this.task.run().then(r => {
            switch (r.type) {
                case "err":
                    // should never happen ???
                    throw Error("got an error from a error-less task ?");
                case "ok":
                    dispatch(this.toMsg(r.value));
            }
        });
    }


}

