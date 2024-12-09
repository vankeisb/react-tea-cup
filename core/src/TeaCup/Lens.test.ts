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

import { describe, expect, test } from 'vitest'

describe("lens", () => {

    test('id', () => {
        const lens = Lenses.id<string>()
        expect(lens.get("foo")).toEqual("foo")
        expect(lens.update("foo", (a) => a + "bar")).toEqual("foobar")
    })

    test('field', () => {
        const StreetLens = Lenses.id<Street>()
        const NameLens = Lenses.field(StreetLens, 'name')
        const street: Street = { name: 'main street', number: 42 }
        expect(NameLens.get(street)).toEqual("main street")
        expect(NameLens.update(street, (n) => "small " + n))
            .toEqual({ name: 'small main street', number: 42 })
    })

    test('field 2', () => {
        const StreetNameLens = Lenses.id<Street>().field('name')
        const street: Street = { name: 'main street', number: 42 }
        expect(StreetNameLens.get(street)).toEqual("main street")
        expect(StreetNameLens.update(street, (n) => "small " + n))
            .toEqual({ name: 'small main street', number: 42 })
    })

    test('deeper', () => {
        const AdressStreetNameLens = Lenses.id<Address>().field('street').field('name')
        const address: Address = {
            street: { name: 'main street', number: 42 },
            city: { name: 'Big', zip: "4242" }
        }
        expect(AdressStreetNameLens.get(address)).toEqual("main street")
        expect(AdressStreetNameLens.update(address, (n) => "small " + n))
            .toEqual({
                street: { name: 'small main street', number: 42 },
                city: { name: 'Big', zip: "4242" }
            })
    })

    test('desriminated guard s', () => {
        const d: SubTypeGuard<Page, UserPage> = Lenses.descriminate('tag', 'user')

        const userPage: Page = { tag: 'user', user: "gnu" }
        const homePage: Page = { tag: 'home' }

        expect(d(userPage)).toEqual(userPage)
        expect(d(homePage)).toBeUndefined
    })

    test('desriminated guard with several tags', () => {
        const d: SubTypeGuard<Page2, UserPage2> = Lenses.descriminate('tag', 'user')
        const d2: SubTypeGuard<Page2, UserPage2> = Lenses.descriminate('tag2', 'user2')

        const userPage: Page2 = { tag: 'user', tag2: 'user2', user: "gnu" }
        const homePage: Page2 = { tag: 'home', tag2: 'home2' }

        expect(d(userPage)).toEqual(userPage)
        expect(d(homePage)).toBeUndefined
        expect(d2(userPage)).toEqual(userPage)
        expect(d2(homePage)).toBeUndefined
    })

    test('desriminated sub type field prism', () => {
        // const UserPageUserPrism = Lenses.id<Page>().sub(p => p.tag === 'user' ? p as UserPage : undefined).field('user')

        const d: SubTypeGuard<Page, UserPage> = Lenses.descriminate('tag', 'user')
        const UserPageUserPrism = Lenses.id<Page>().sub(d).field('user')
        // WONTWORK
        // const UserPageUserPrism2 = Lenses.id<Page>().sub(Lenses.descriminate('tag', 'user')).field('user')

        const userPage: Page = { tag: 'user', user: "gnu" }
        const homePage: Page = { tag: 'home' }

        expect(UserPageUserPrism.get(userPage)).toEqual("gnu")
        expect(UserPageUserPrism.get(homePage)).toBeUndefined

        expect(UserPageUserPrism.update(userPage, u => u + "!")).toEqual({ tag: 'user', user: "gnu!" })
        expect(UserPageUserPrism.update(homePage, u => u + "!")).toEqual(undefined)
    })

    test('with context', () => {
        const AdressStreetNameLens = Lenses.id<Address>().withContext(a => a.city.name).field('street').field('name')
        const address: Address = {
            street: { name: 'main street', number: 42 },
            city: { name: 'Big', zip: "4242" }
        }
    });
});

abstract class Lens<A, B> {
    abstract get(a: A): B
    abstract update(a: A, f: (b: B) => B): A

    field<K extends keyof B>(field: K): Lens<A, B[K]> {
        return Lenses.field(this, field);
    }

    sub<C extends B>(f: (b: B) => C | undefined): Prism<A, C> {
        return Lenses.sub(this, f);
    }

    withContext<C>(f: (b: B) => C): ContextPrism<, B, C> {
        return Lenses.withContext(this, f)
    }

}

abstract class Prism<A, B> {
    abstract get(a: A): B | undefined
    abstract update(a: A, f: (b: B) => B | undefined): A | undefined

    field<K extends keyof B>(field: K): Prism<A, B[K]> {
        return Prisms.field(this, field);
    }

    // sub<C extends B>(f: (b: B) => C | undefined): Lens<A, C | undefined> {
    //     return Lenses.sub(this, f);
    // }
}

abstract class ContextLens<A, B, C> {
    abstract get(c: A): [B, C]
    abstract update(a: A, f: (b: [B, C]) => B): A
}

type SubTypeGuard<A, B extends A> = (a: A) => B | undefined

class Lenses {
    static id<A>(): Lens<A, A> {
        return new IdLens<A>();
    }

    static field<A, B, K extends keyof B>(l: Lens<A, B>, field: K): Lens<A, B[K]> {
        return new FieldLens<A, B, K>(l, field);
    }

    static sub<A, B, C extends B>(l: Lens<A, B>, f: SubTypeGuard<B, C>): Prism<A, C> {
        return new SubPrism<A, B, C>(l, f);
    }

    static descriminate<B, C extends B, K extends keyof B>(tag: K, v: C[K]): SubTypeGuard<B, C> {
        return o => o[tag] === v ? o as C : undefined;
    }

    static withContext<A, B, C>(l: Lens<A, B>, f: (b: B) => C): ContextPrism<A, B, C> {
        return new ContextPrism(l, f);
    }

    // static withDefault<A, B>(l: Prism<A, B>): Lens<A, B> {
    //     new WithDefaultLens<A, B>(l);
    // }
}

class Prisms {
    static field<A, B, K extends keyof B>(l: Prism<A, B>, field: K): Prism<A, B[K]> {
        return new FieldPrism<A, B, K>(l, field);
    }
}

class IdLens<A> extends Lens<A, A> {
    get(a: A): A {
        return a;
    }

    update(a: A, f: (b: A) => A): A {
        return f(a);
    }
}

class FieldLens<A, B, K extends keyof B> extends Lens<A, B[K]> {
    private readonly _l: Lens<A, B>;
    private readonly _field: K;

    constructor(l: Lens<A, B>, field: K) {
        super();
        this._l = l;
        this._field = field;
    }

    get(a: A): B[K] {
        return this._l.get(a)[this._field];
    }

    update(a: A, f: (b: B[K]) => B[K]): A {
        return this._l.update(a, b => {
            const field = f(b[this._field]);
            const updated: B = { ...b }
            updated[this._field] = field
            return updated;
        });
    }
}

class FieldPrism<A, B, K extends keyof B> extends Prism<A, B[K]> {
    private readonly _l: Prism<A, B>;
    private readonly _field: K;

    constructor(l: Prism<A, B>, field: K) {
        super();
        this._l = l;
        this._field = field;
    }

    get(a: A): B[K] | undefined {
        const b = this._l.get(a);
        return b && b[this._field];
    }

    update(a: A, f: (b: B[K]) => B[K] | undefined): A | undefined {
        return this._l.update(a, b => {
            const field = f(b[this._field]);
            if (field !== undefined) {
                const updated: B = { ...b }
                updated[this._field] = field
                return updated;
            }
        });
    }
}

class SubPrism<A, B, C extends B> extends Prism<A, C> {
    private readonly _l: Prism<A, B>;
    private readonly _f: (b: B) => C | undefined;

    constructor(l: Prism<A, B>, f: (b: B) => C | undefined) {
        super();
        this._l = l;
        this._f = f;
    }

    get(a: A): C | undefined {
        const c = this._l.get(a)
        return c && this._f(c);
    }

    update(a: A, f: (b: C) => C): A | undefined {
        return this._l.update(a, b => {
            const c = this._f(b)
            if (c !== undefined) {
                const c1 = f(c)
                return { ...c1 }
            }
            return undefined
        })
    }
}

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

interface Street {
    readonly name: string
    readonly number: number
}

interface City {
    readonly name: string
    readonly zip: string
}


interface Address {
    readonly street: Street
    readonly city: City
}

interface Model {
    readonly page: Page
}

type Page =
    { readonly tag: 'home' }
    | UserPage;
type UserPage = { readonly tag: 'user', readonly user: string }

type Page2 =
    { readonly tag: 'home', readonly tag2: 'home2' }
    | UserPage2;
type UserPage2 = { readonly tag: 'user', readonly tag2: 'user2', readonly user: string }
