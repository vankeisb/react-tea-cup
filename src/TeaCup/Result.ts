import {Just, Maybe, Nothing} from "./Maybe";

export abstract class Result<E,R> {
    abstract isOk(): boolean
    abstract map<R2>(f:(r:R) => R2): Result<E,R2>
    abstract mapError<E2>(f:(e:E) => E2): Result<E2,R>
    abstract toMaybe(): Maybe<R>
    abstract get():R;
    abstract getError():E;
}


class ROk<E,R> extends Result<E, R> {

    private readonly value:R;

    constructor(value: R) {
        super();
        this.value = value;
    }

    isOk(): boolean {
        return true;
    }

    map<R2>(f: (r: R) => R2): Result<E, R2> {
        return new ROk(f(this.value));
    }

    mapError<E2>(f: (e: E) => E2): Result<E2, R> {
        return new ROk<E2,R>(this.value);
    }

    toMaybe(): Maybe<R> {
        return Just(this.value);
    }

    get(): R {
        return this.value;
    }

    getError(): E {
        throw Error("trying to get error on Ok");
    }

}

class RErr<E,R> extends Result<E,R> {

    private readonly err:E;

    constructor(err: E) {
        super();
        this.err = err;
    }

    isOk(): boolean {
        return false;
    }

    map<R2>(f: (r: R) => R2): Result<E, R2> {
        return new RErr<E,R2>(this.err);
    }

    mapError<E2>(f: (e: E) => E2): Result<E2, R> {
        return new RErr<E2,R>(f(this.err))
    }

    toMaybe(): Maybe<R> {
        return Nothing();
    }

    get(): R {
        throw Error("trying to get result on Err");
    }

    getError(): E {
        return this.err;
    }

}


export function Ok<R>(r:R): Result<void, R> {
    return new ROk(r);
}

export function Err<E>(e: E): Result<E, void> {
    return new RErr(e);
}
