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

import {List} from "./List";
import {just, Maybe, nothing} from "./Maybe";

test("immutable from array", () => {
    const a = ["foo", "bar", "baz"];
    const l:List<string> = List.fromArray(a);
    expect(l.length()).toBe(3);
    expect(l.toArray()).toEqual(a);
    a[0] = ("mutated");
    expect(l.toArray()).toEqual(["foo", "bar", "baz"]);
});


test("empty list", () => {
    expect(List.empty().length()).toBe(0);
    expect(List.fromArray([])).toEqual(List.empty());
    expect(List.empty().toArray()).toEqual([]);
});


test("head and tail", () => {

    function expectHeadAndTail<T>(l:List<T>, head: Maybe<T>, tail: Array<T>) {
        expect(l.head()).toEqual(head);
        expect(l.tail().toArray()).toEqual(tail);
    }

    expectHeadAndTail(List.empty(), nothing, []);
    expectHeadAndTail(List.fromArray(["foo"]), just("foo"), []);
    expectHeadAndTail(List.fromArray([1, 2]), just(1), [2]);
    expectHeadAndTail(List.fromArray([true, true, false]), just(true), [true, false]);
});


test("map", () => {
    const l: List<number> = List.fromArray([1, 2, 3]);
    expect(l.map((i:number) => i + 1)).toEqual(List.fromArray([2, 3, 4]))
});

