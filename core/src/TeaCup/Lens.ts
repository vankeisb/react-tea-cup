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

import { just, Maybe, maybeOf, nothing } from './Maybe';

export class Lens<A, B> {
  constructor(readonly get: (a: A) => B, readonly update: (a: A, f: (b: B) => B) => A) {}

  field<K extends keyof B>(field: K): Lens<A, B[K]> {
    return new Lens<A,B[K]>(
      (a) => {
        const b = this.get(a);
        return b[field];
      },
      (a, f) => {
        return this.update(a, b => {
          const fv = f(b[field]);
          const newB = {
            ...b
          }
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
        return mc.map(c => {
          const c2 = f2(c);
          return this.update(a, () => c2);
        })
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
        return this.update(a, (b:B) => {
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
}

export type SubTypeGuard<A, B extends A> = (a: A) => Maybe<B>;

export class Lenses {
  static id<A>(): Lens<A, A> {
    return new Lens(
      (a) => a,
      (a, f) => f(a),
    );
  }

  //   static field<A, B, K extends keyof B>(l: Lens<A, B>, field: K): Lens<A, B[K]> {
  //     return new FieldLens<A, B, K>(l, field);
  //   }

  //   static sub<A, B, C extends B>(l: Lens<A, B>, f: SubTypeGuard<B, C>): Prism<A, C> {
  //     return new SubPrism<A, B, C>(l, f);
  //   }

  static discriminate<B, C extends B, K extends keyof B>(tag: K, v: C[K]): SubTypeGuard<B, C> {
    return (o) => (o[tag] === v ? just(o as C) : nothing);
  }

  // static withDefault<A, B>(l: Prism<A, B>): Lens<A, B> {
  //     new WithDefaultLens<A, B>(l);
  // }
}

// export class Prisms {
//   static field<A, B, K extends keyof B>(l: Prism<A, B>, field: K): Prism<A, B[K]> {
//     return new FieldPrism<A, B, K>(l, field);
//   }
// }

// export class IdLens<A> extends Lens<A, A> {
//   get(a: A): A {
//     return a;
//   }

//   update(a: A, f: (b: A) => A): A {
//     return f(a);
//   }
// }

// export class FieldLens<A, B, K extends keyof B> extends Lens<A, B[K]> {
//   private readonly _l: Lens<A, B>;
//   private readonly _field: K;

//   constructor(l: Lens<A, B>, field: K) {
//     super();
//     this._l = l;
//     this._field = field;
//   }

//   get(a: A): B[K] {
//     return this._l.get(a)[this._field];
//   }

//   update(a: A, f: (b: B[K]) => B[K]): A {
//     return this._l.update(a, (b) => {
//       const field = f(b[this._field]);
//       const updated: B = { ...b };
//       updated[this._field] = field;
//       return updated;
//     });
//   }
// }

// export class FieldPrism<A, B, K extends keyof B> extends Prism<A, B[K]> {
//   private readonly _l: Prism<A, B>;
//   private readonly _field: K;

//   constructor(l: Prism<A, B>, field: K) {
//     super();
//     this._l = l;
//     this._field = field;
//   }

//   get(a: A): Maybe<B[K]> {
//     return this._l.get(a).map((b) => b[this._field]);
//   }

//   update(a: A, f: (b: B[K]) => B[K]): Maybe<A> {
//     return this._l.update(a, (b) => {
//       const c = f(b[this._field]);
//       const updated: A = { ...a };
//       updated[this._field] = c;
//       return updated;
//     });

//     return this._l.update(a, (b) => {
//       return f(b[this._field]).map((c) => {
//         const updated: B = { ...b };
//         updated[this._field] = c;
//         return updated;
//       });
//     });
//   }
// }

// export class SubPrism<A, B, C extends B> extends Prism<A, C> {
//   private readonly _l: Lens<A, B>;
//   private readonly _f: (b: B) => Maybe<C>;

//   constructor(l: Lens<A, B>, f: (b: B) => Maybe<C>) {
//     super();
//     this._l = l;
//     this._f = f;
//   }

//   get(a: A): Maybe<C> {
//     return this._f(this._l.get(a));
//   }

//   update(a: A, f: (b: C) => C): Maybe<A> {
//     const b = this._l.get(a);
//     const mc = this._f(b);
//     return mc.map((c) => {
//       return this._l.update(a, () => c);
//     });
//   }
// }

// type FallbackFun[B] = () => B

// class WithDefaultLens<A, B> extends Lens<A, (supplyDefault: () => B) => B> {

//     private readonly _l: Lens<A, B | undefined>;

//     constructor(l: Lens<A, B | undefined>) {
//         super();
//         this._l = l;
//     }

//     get(a: A): (supplyDefault: () => B) => B {
//         const b = this._l.get(a)
//         return supplyDefault => {
//             return b ?? supplyDefault();
//         }
//     }

//     update(a: A, f: (b: B) => B): A {
//         return f(a);
//     }
// }
