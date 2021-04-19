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

/**
 * Maybe is either "just something", ot "nothing" !
 */
export type Maybe<T> = Just<T> | Nothing<T>;

/**
 * A Maybe with something inside
 */
export class Just<T> {
  readonly type: 'Just' = 'Just';
  readonly value: T;

  constructor(value: T) {
    this.value = value;
  }

  map<T2>(f: (t: T) => T2): Maybe<T2> {
    return new Just(f(this.value));
  }

  withDefault(_: T): T {
    return this.value;
  }

  withDefaultSupply(f: () => T): T {
    return this.value;
  }

  orElse(e: Maybe<T>): Maybe<T> {
    return this;
  }

  orElseSupply(f: () => Maybe<T>): Maybe<T> {
    return this;
  }

  forEach(f: (t: T) => void): void {
    f(this.value);
  }

  andThen<T2>(f: (t: T) => Maybe<T2>): Maybe<T2> {
    return f(this.value);
  }

  toNative(): T | undefined {
    return this.value;
  }

  isJust(): boolean {
    return true;
  }

  isNothing(): boolean {
    return false;
  }

  filter(f: (t: T) => boolean): Maybe<T> {
    if (f(this.value)) {
      return this;
    }
    return nothing;
  }
}

/**
 * Wrap an object into a Maybe
 * @param t the object to wrap
 */
export function just<T>(t: T): Maybe<T> {
  return new Just<T>(t);
}

/**
 * An "empty" Maybe
 */
export class Nothing<T> {
  readonly type: 'Nothing' = 'Nothing';
  static value: Nothing<never> = new Nothing();

  private constructor() {}

  map<T2>(f: (t: T) => T2): Maybe<T2> {
    return Nothing.value;
  }

  withDefault(d: T): T {
    return d;
  }

  withDefaultSupply(f: () => T): T {
    return f();
  }

  orElse(e: Maybe<T>): Maybe<T> {
    return e;
  }

  orElseSupply(f: () => Maybe<T>): Maybe<T> {
    return f();
  }

  forEach(f: (t: T) => void): void {}

  andThen<T2>(f: (t: T) => Maybe<T2>): Maybe<T2> {
    return nothing;
  }

  toNative(): T | undefined {
    return undefined;
  }

  isJust(): boolean {
    return false;
  }

  isNothing(): boolean {
    return true;
  }

  filter(): Maybe<T> {
    return nothing;
  }
}

/**
 * The "nothing" maybe.
 */
export const nothing: Maybe<never> = Nothing.value;

/**
 * Make a Maybe with a "nullable" object
 * @param t the object, or undef, or null
 */
export function maybeOf<T>(t: T | undefined | null): Maybe<T> {
  if (t === undefined || t === null) {
    return nothing;
  } else {
    return just(t);
  }
}

/**
 * Apply a function if all the arguments are `Just` a value.
 * @param m1 First Maybe
 * @param m2 Second Maybe
 * @param func the function applied on the values of the Maybes
 */
export function map2<T1, T2, T3>(m1: Maybe<T1>, m2: Maybe<T2>, func: (a: T1, b: T2) => T3): Maybe<T3> {
  return m1
    .map((a) => {
      return m2
        .map((b) => {
          return new Just(func(a, b)) as Maybe<T3>;
        })
        .withDefault(nothing);
    })
    .withDefault(nothing);
}
