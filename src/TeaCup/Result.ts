/*
 * MIT License
 *
 * Copyright (c) 2019 Rémi Van Keisbelck
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

import { just, Maybe, nothing } from "./Maybe";

/**
 * A computation may result in a value (Ok), or an error (Err)
 */
export type Result<E, R> = Ok<E, R> | Err<E, R>


export class Ok<E, R> {

    readonly tag: "Ok" = "Ok";
    readonly value: R;

    constructor(value: R) {
        this.value = value;
    }

    map<R2>(f: (r: R) => R2): Result<E, R2> {
        return new Ok(f(this.value));
    }

    mapError<E2>(f: (e: E) => E2): Result<E2, R> {
        return new Ok<E2, R>(this.value);
    }

    toMaybe(): Maybe<R> {
        return just(this.value);
    }

    match<X>(onOk: (r: R) => X, onErr: (e: E) => X): X {
        return onOk(this.value);
    }

    withDefault(v: R): R {
        return this.value;
    }

    withDefaultSupply(f: (() => R)): R {
        return this.value;
    }

    andThen<R2>(f: (r: R) => Result<E, R2>): Result<E, R2> {
        return f(this.value);
    }

    // orElse?
    recover(f: ((e: E) => Result<E, R>)): Result<E, R> {
        return this;
    }

}


export class Err<E, R> {

    readonly tag: "Err" = "Err";
    readonly err: E;

    constructor(err: E) {
        this.err = err;
    }

    map<R2>(f: (r: R) => R2): Result<E, R2> {
        return new Err<E, R2>(this.err);
    }

    mapError<E2>(f: (e: E) => E2): Result<E2, R> {
        return new Err<E2, R>(f(this.err))
    }

    toMaybe(): Maybe<R> {
        return nothing;
    }

    match<X>(onOk: (r: R) => X, onErr: (e: E) => X): X {
        return onErr(this.err);
    }

    withDefault(r: R): R {
        return r;
    }

    withDefaultSupply(f: (() => R)): R {
        return f();
    }

    andThen<R2>(f: (r: R) => Result<E, R2>): Result<E, R2> {
        return err(this.err);
    }

    // orElse?
    recover(f: ((e: E) => Result<E, R>)): Result<E, R> {
        return f(this.err);
    }

}

/**
 * Create an Ok Result
 * @param r the value to wrap
 */
export function ok<E, R>(r: R): Result<E, R> {
    return new Ok<E, R>(r);
}


/**
 * Create an Err result
 * @param e the error to wrap
 */
export function err<E, R>(e: E): Result<E, R> {
    return new Err(e);
}
