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

import { just, nothing, Maybe } from './Maybe';

/**
 * Immutable list of data
 */
export class List<T> {
  private readonly elems: Array<T>;

  private constructor(elems: Array<T>) {
    this.elems = [...elems];
  }

  static fromArray<T>(ts: Array<T>): List<T> {
    if (ts.length === 0) {
      return List.empty();
    } else {
      return new List<T>(ts);
    }
  }

  static empty<T>(): List<T> {
    return new List<T>([]);
  }

  head(): Maybe<T> {
    if (this.length() === 0) {
      return nothing;
    } else {
      return just(this.elems[0]);
    }
  }

  length(): number {
    return this.elems.length;
  }

  tail(): List<T> {
    if (this.length() <= 1) {
      return new List([]);
    } else {
      const tailArray = [...this.elems];
      tailArray.shift();
      return new List<T>(tailArray);
    }
  }

  toArray(): Array<T> {
    return [...this.elems];
  }

  map<T2>(f: (t: T) => T2): List<T2> {
    return new List(this.elems.map(f));
  }

  mapWithIndex<T2>(f: (t: T, i: number) => T2): List<T2> {
    return new List(this.elems.map(f));
  }
}
