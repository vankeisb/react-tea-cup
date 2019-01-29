import { Cmd } from "./Cmd";
import { Result } from "./Result";
export declare abstract class Task<E, R> {
    abstract run(): Promise<Result<E, R>>;
    static attempt<E, R, M>(t: Task<E, R>, toMsg: (r: Result<E, R>) => M): Cmd<M>;
    static perform<R, M>(t: Task<void, R>, toMsg: (r: R) => M): Cmd<M>;
}
