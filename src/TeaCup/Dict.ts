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

import {Tuple} from "./Tuple";
import {Maybe, maybeOf} from "./Maybe";

export class Dict<T> {
    private readonly d: { [id: string]: T };

    private constructor(d: { [p: string]: T }) {
        this.d = d;
    }

    static empty<T>(): Dict<T> {
        return new Dict<T>({});
    }

    static fromList<T>(entries: readonly Tuple<string, T>[]): Dict<T> {
        const newD: { [id: string]: T } = {};
        entries.forEach(e => {
            newD[e.a] = e.b;
        });
        return new Dict<T>(newD);
    }

    put(key: string, value: T): Dict<T> {
        const newD = { ...this.d };
        newD[key] = value;
        return new Dict<T>(newD);
    }

    get(key: string): Maybe<T> {
        return maybeOf(this.d[key]);
    }

    exists(key: string): boolean {
        return this.d[key] !== undefined;
    }

    remove(key: string): Dict<T> {
        if (this.d[key]) {
            const newD = { ...this.d };
            delete newD[key];
            return new Dict<T>(newD);
        }
        return this;
    }

    keys(): readonly string[] {
        return Object.keys(this.d);
    }

    size(): number {
        return this.keys().length;
    }

    isEmpty(): boolean {
        return this.size() === 0;
    }

    toList(): readonly Tuple<string, T>[] {
        return this.keys().map(k => new Tuple(k, this.d[k]));
    }

    filter(f: (t: Tuple<string, T>) => boolean): Dict<T> {
        return Dict.fromList(this.toList().filter(f));
    }

    update(key: string, f: (v: Maybe<T>) => Maybe<T>): Dict<T> {
        return f(this.get(key))
            .map(value => this.put(key, value))
            .withDefaultSupply(() => this.remove(key));
    }
}
