/*
 * MIT License
 *
 * Copyright (c) 2024 Rémi Van Keisbelck, Frank Wagner
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

export class LensWithResult<A, B, R> {
  constructor(readonly get: (a: A) => B, readonly update: (a: A, f: (b: B) => [B, R]) => [A, R]) {}

  field<K extends keyof B>(field: K): LensWithResult<A, B[K], R> {
    return new LensWithResult<A, B[K], R>(
      (a) => {
        const b = this.get(a);
        return b[field];
      },
      (a, f) => {
        return this.update(a, (b) => {
          const fv = f(b[field]);
          const newB = {
            ...b,
          };
          newB[field] = fv[0];
          return [newB, fv[1]];
        });
      },
    );
  }

  sub<C extends B>(f: (b: B) => Maybe<C>): PrismWithResult<A, C, R> {
    return new PrismWithResult(
      (a) => {
        const b = this.get(a);
        return f(b);
      },
      (a, f2) => {
        const b = this.get(a);
        const mc = f(b);
        return mc.map((c) => {
          const c2 = f2(c);
          return this.update(a, () => c2);
        });
      },
    );
  }
}

export class PrismWithResult<A, B, R> {
  constructor(readonly get: (a: A) => Maybe<B>, readonly update: (a: A, f: (b: B) => [B, R]) => Maybe<[A, R]>) {}

  field<K extends keyof B>(field: K): PrismWithResult<A, B[K], R> {
    return new PrismWithResult<A, B[K], R>(
      (a) => {
        return this.get(a).map((b) => {
          return b[field];
        });
      },
      (a, f) => {
        return this.update(a, (b: B) => {
          const fieldVal: B[K] = b[field];
          const newFieldVal = f(fieldVal);
          const newB = {
            ...b,
          };
          newB[field] = newFieldVal[0];
          return [newB, newFieldVal[1]];
        });
      },
    );
  }

  sub<C extends B>(f: (b: B) => Maybe<C>): PrismWithResult<A, C, R> {
    return new PrismWithResult<A, C, R>(
      (a) => {
        const b = this.get(a);
        return b.andThen(f);
      },
      (a, f2) => {
        const b = this.get(a);
        const mc = b.andThen(f);
        return mc.andThen((c) => {
          const c2 = f2(c);
          return this.update(a, () => c2);
        });
      },
    );
  }
}

export class Lens<A, B> {
  constructor(readonly get: (a: A) => B, readonly update: (a: A, f: (b: B) => B) => A) {}

  field<K extends keyof B>(field: K): Lens<A, B[K]> {
    return new Lens<A, B[K]>(
      (a) => {
        const b = this.get(a);
        return b[field];
      },
      (a, f) => {
        return this.update(a, (b) => {
          const fv = f(b[field]);
          const newB = {
            ...b,
          };
          newB[field] = fv;
          return newB;
        });
      },
    );
  }

  sub<C extends B>(f: (b: B) => Maybe<C>): Prism<A, C> {
    return new Prism(
      (a) => {
        const b = this.get(a);
        return f(b);
      },
      (a, f2) => {
        const b = this.get(a);
        const mc = f(b);
        return mc.map((c) => {
          const c2 = f2(c);
          return this.update(a, () => c2);
        });
      },
    );
  }
}

export class Prism<A, B> {
  constructor(readonly get: (a: A) => Maybe<B>, readonly update: (a: A, f: (b: B) => B) => Maybe<A>) {}

  field<K extends keyof B>(field: K): Prism<A, B[K]> {
    return new Prism(
      (a) => {
        return this.get(a).map((b) => {
          return b[field];
        });
      },
      (a, f) => {
        return this.update(a, (b: B) => {
          const fieldVal: B[K] = b[field];
          const newFieldVal = f(fieldVal);
          const newB = {
            ...b,
          };
          newB[field] = newFieldVal;
          return newB;
        });
      },
    );
  }

  sub<C extends B>(f: (b: B) => Maybe<C>): Prism<A, C> {
    return new Prism(
      (a) => {
        const b = this.get(a);
        return b.andThen(f);
      },
      (a, f2) => {
        const b = this.get(a);
        const mc = b.andThen(f);
        return mc.andThen((c) => {
          const c2 = f2(c);
          return this.update(a, () => c2);
        });
      },
    );
  }
}

export type SubTypeGuard<A, B extends A> = (a: A) => Maybe<B>;

export function idLens<A>(): Lens<A, A> {
  return new Lens(
    (a) => a,
    (a, f) => f(a),
  );
}

export function idLensWithResult<A, R>(): LensWithResult<A, A, R> {
  return new LensWithResult<A, A, R>(
    (a) => a,
    (a, f) => f(a),
  );
}

export function discriminate<B, C extends B, K extends keyof B>(tag: K, v: C[K]): SubTypeGuard<B, C> {
  return (o) => (o[tag] === v ? just(o as C) : nothing);
}
