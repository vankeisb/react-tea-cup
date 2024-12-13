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

import { just, Maybe, nothing } from "./Maybe";

type MaybeOf<M> = M extends Maybe<infer A> ? A : never;

export class Lens<A, B> {
  constructor(readonly get: (a: A) => B, readonly set: (a: A, b: B) => A) {}

  update(a: A, f: (b: B) => B): A {
    return this.set(a, f(this.get(a)));
  }

  updateWithResult<R>(a: A, f: (b: B) => [B, R]): [A, R] {
    const [b, r] = f(this.get(a));
    return [this.set(a, b), r];
  }

  field<K extends keyof B>(field: K): Lens<A, B[K]> {
    return composeLenses(this, fieldLens(field));
  }

  sub<C extends B>(f: (b: B) => Maybe<C>): Prism<A, C> {
    return composeLensPrism(this, subPrism(f));
  }

  flatten(): Prism<A, MaybeOf<B>> {
    return composeLensPrism(
      this as unknown as Lens<A, Maybe<MaybeOf<B>>>,
      flattenPrism<B>()
    );
  }

  andThenLens<C>(lens: Lens<B, C>): Lens<A, C> {
    return composeLenses(this, lens);
  }

  andThenPrism<C>(prism: Prism<B, C>): Prism<A, C> {
    return composeLensPrism(this, prism);
  }
}

export class Prism<A, B> {
  constructor(
    readonly get: (a: A) => Maybe<B>,
    readonly set: (a: A, b: B) => A
  ) {}

  update(a: A, f: (b: B) => B): Maybe<A> {
    return this.get(a)
      .map(f)
      .map((fb) => this.set(a, fb));
  }

  updateWithResult<R>(a: A, f: (b: B) => [B, R]): Maybe<[A, R]> {
    return this.get(a)
      .map(f)
      .map(([b, r]) => [this.set(a, b), r]);
  }

  field<K extends keyof B>(field: K): Prism<A, B[K]> {
    return composePrismLens(this, fieldLens(field));
  }

  sub<C extends B>(f: (b: B) => Maybe<C>): Prism<A, C> {
    return composePrisms(this, subPrism(f));
  }

  andThen<C>(lens: Lens<B, C> | Prism<B, C>): Prism<A, C> {
    if (lens instanceof Lens) {
      return composePrismLens(this, lens);
    } else {
      return composePrisms(this, lens);
    }
  }

  flatten(): Prism<A, MaybeOf<B>> {
    return composePrisms(
      this as unknown as Prism<A, Maybe<MaybeOf<B>>>,
      flattenPrism()
    );
  }
}

export type SubTypeGuard<A, B extends A> = (a: A) => Maybe<B>;

export function idLens<A>(): Lens<A, A> {
  return new Lens(
    (a) => a,
    (_, v) => v
  );
}

export function composeLenses<A, B, C>(
  l1: Lens<A, B>,
  l2: Lens<B, C>
): Lens<A, C> {
  return new Lens(
    (a) => l2.get(l1.get(a)),
    (a, v) => l1.set(a, l2.set(l1.get(a), v))
  );
}

export function composeLensPrism<A, B, C>(
  l: Lens<A, B>,
  p: Prism<B, C>
): Prism<A, C> {
  return new Prism(
    (a) => p.get(l.get(a)),
    (a, v) => l.set(a, p.set(l.get(a), v))
  );
}

export function composePrismLens<A, B, C>(
  p: Prism<A, B>,
  l: Lens<B, C>
): Prism<A, C> {
  return new Prism(
    (a) => p.get(a).map(l.get),
    (a, v) =>
      p
        .get(a)
        .map((b) => l.set(b, v))
        .map((bc) => p.set(a, bc))
        .withDefault(a)
  );
}

export function composePrisms<A, B, C>(
  p: Prism<A, B>,
  p2: Prism<B, C>
): Prism<A, C> {
  return new Prism(
    (a) => p.get(a).andThen(p2.get),
    (a, v) =>
      p
        .get(a)
        .map((b) => p2.set(b, v))
        .map((bc) => p.set(a, bc))
        .withDefault(a)
  );
}

export function fieldLens<A, K extends keyof A>(field: K): Lens<A, A[K]> {
  return new Lens(
    (a) => a[field],
    (a, v) => {
      const a1 = { ...a };
      a1[field] = v;
      return a1;
    }
  );
}

export function flattenPrism<A>(): Prism<Maybe<MaybeOf<A>>, MaybeOf<A>> {
  return new Prism(
    (a) => a,
    (a, v) => a.map(() => v).orElse(a)
  );
}

export function discriminate<B, C extends B, K extends keyof B>(
  tag: K,
  v: C[K]
): SubTypeGuard<B, C> {
  return (o) => (o[tag] === v ? just(o as C) : nothing);
}

export function subPrism<A, B extends A>(f: (a: A) => Maybe<B>): Prism<A, B> {
  return new Prism(
    (a) => f(a),
    (a, v) =>
      f(a)
        .map<A>(() => v)
        .withDefault(a)
  );
}
