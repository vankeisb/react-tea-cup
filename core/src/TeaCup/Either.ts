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

import { just, Maybe, nothing } from './Maybe';

/**
 * Either left, or right.
 */
export type Either<A, B> = Left<A, B> | Right<A, B>;

export class Left<A, B> {
  readonly tag = 'Left';
  readonly value: A;

  constructor(value: A) {
    this.value = value;
  }

  isLeft(): boolean {
    return true;
  }

  isRight(): boolean {
    return !this.isLeft();
  }

  mapLeft<C>(f: (a: A) => C): Either<C, B> {
    return new Left(f(this.value));
  }

  mapRight<C>(f: (b: B) => C): Either<A, C> {
    return new Left(this.value);
  }

  match<R>(onLeft: (a: A) => R, onRight: (b: B) => R): R {
    return onLeft(this.value);
  }

  get left(): Maybe<A> {
    return just(this.value);
  }

  get right(): Maybe<B> {
    return nothing;
  }

  toNative(): A {
    return this.value;
  }
}

export class Right<A, B> {
  readonly tag = 'Right';
  readonly value: B;

  constructor(value: B) {
    this.value = value;
  }

  isLeft(): boolean {
    return false;
  }

  isRight(): boolean {
    return !this.isLeft();
  }

  mapLeft<C>(f: (a: A) => C): Either<C, B> {
    return new Right(this.value);
  }

  mapRight<C>(f: (b: B) => C): Either<A, C> {
    return new Right(f(this.value));
  }

  match<R>(onLeft: (a: A) => R, onRight: (b: B) => R): R {
    return onRight(this.value);
  }

  get left(): Maybe<A> {
    return nothing;
  }

  get right(): Maybe<B> {
    return just(this.value);
  }

  toNative(): B {
    return this.value;
  }
}

export function left<A, B>(a: A): Either<A, B> {
  return new Left(a);
}

export function right<A, B>(b: B): Either<A, B> {
  return new Right(b);
}
