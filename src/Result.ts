export type Result<E,R> = Ok<R> | Err<E>

export interface Ok<R> {
    type: "ok",
    value: R
}

export interface Err<E> {
    type: "err",
    value: E
}

export function Ok<E, R>(r:R): Result<E, R> {
    return {
        type: "ok",
        value: r
    }
}

export function Err<E, R>(e: E): Result<E, R> {
    return {
        type: "err",
        value: e
    }
}
