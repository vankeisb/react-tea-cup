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

import {just, Maybe, nothing} from "./Maybe";

export class ListWithSelection<T> {
    private readonly l1: ReadonlyArray<T>;
    private readonly l2: ReadonlyArray<T>;
    private readonly sel: Maybe<T>;

    private constructor(l1: ReadonlyArray<T>, l2: ReadonlyArray<T>, sel: Maybe<T>) {
        this.l1 = l1;
        this.l2 = l2;
        this.sel = sel;
    }

    static fromArray<T>(a: ReadonlyArray<T>): ListWithSelection<T> {
        return new ListWithSelection(a, [], nothing);
    }

    static empty<T>(): ListWithSelection<T> {
        return new ListWithSelection([], [], nothing);
    }

    toArray(): ReadonlyArray<T> {
        return this.l1
            .concat(
                this.sel.map(t => [t]).withDefault([])
            )
            .concat(this.l2);
    }

    select(f:(item:T, index:number, arr: ReadonlyArray<T>) => boolean): ListWithSelection<T> {
        const l = this.toArray();
        const l1 = [];
        const l2 = [];
        let sel: Maybe<T> = nothing;
        for (let i = 0; i < l.length; i++) {
            switch (sel.type) {
                case "Nothing": {
                    // nothing selected yet, we need to test
                    const selected = f(l[i], i, l);
                    if (selected) {
                        sel = just(l[i]);
                    } else {
                        l1.push(l[i]);
                    }
                    break;
                }
                case "Just": {
                    // selection done already, feed into l2
                    l2.push(l[i]);
                    break;
                }
            }
        }
        return new ListWithSelection<T>(l1, l2, sel);
    }

    selectIndex(index: number): ListWithSelection<T> {
        return this.select((item, i) => i === index);
    }

    isSelected(item: T): boolean {
        return this.sel.map(t => t === item).withDefault(false)
    }

    getSelected(): Maybe<T> {
        return this.sel;
    }

    getSelectedIndex(): Maybe<number> {
        return this.sel.map(t => this.l1.length)
    }

    length(): number {
        return this.toArray().length;
    }
}