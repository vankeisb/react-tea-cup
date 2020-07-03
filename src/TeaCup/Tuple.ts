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
 * Helper for managing tuples.
 */
export class Tuple<A, B> {
  readonly a: A;
  readonly b: B;

  constructor(a: A, b: B) {
    this.a = a;
    this.b = b;
  }

  /**
   * Transform to a native tuple (array-like)
   */
  toNative(): [A, B] {
    return [this.a, this.b];
  }

  mapFirst<C>(f: (a: A) => C): Tuple<C, B> {
    return new Tuple<C, B>(f(this.a), this.b);
  }

  mapSecond<C>(f: (b: B) => C): Tuple<A, C> {
    return new Tuple<A, C>(this.a, f(this.b));
  }

  mapBoth<C, D>(f1: (a: A) => C, f2: (b: B) => D): Tuple<C, D> {
    return new Tuple<C, D>(f1(this.a), f2(this.b));
  }

  static fromNative<A, B>(t: [A, B]): Tuple<A, B> {
    return new Tuple(t[0], t[1]);
  }

  /**
   * Create a new tuple with passed values
   * @param a the first value
   * @param b the second value
   */
  static t2<A, B>(a: A, b: B): Tuple<A, B> {
    return new Tuple<A, B>(a, b);
  }

  /**
   * Create a native tuple with passed values
   * @param a the first value
   * @param b the second value
   */
  static t2n<A, B>(a: A, b: B): [A, B] {
    return [a, b];
  }
}
