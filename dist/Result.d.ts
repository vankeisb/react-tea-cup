export declare type Result<E, R> = Ok<R> | Err<E>;
export interface Ok<R> {
    type: "ok";
    value: R;
}
export interface Err<E> {
    type: "err";
    value: E;
}
export declare function Ok<E, R>(r: R): Result<E, R>;
export declare function Err<E, R>(e: E): Result<E, R>;
