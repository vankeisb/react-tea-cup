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

import { just, map2, Maybe, nothing } from "./Maybe";

test("just with default", () => {
    expect(just(1).withDefault(2)).toBe(1);
});

test("just with default supply", () => {
    expect(just(1).withDefaultSupply(() => 2)).toBe(1);
});

test("nothing with default", () => {
    const m: Maybe<number> = nothing;
    expect(m.withDefault(1)).toBe(1);
});

test("nothing with default supply", () => {
    const m: Maybe<number> = nothing;
    expect(m.withDefaultSupply(() => 1)).toBe(1);
});

test("just or else", () => {
    expect(just(1).orElse(just(13))).toEqual(just(1));
});

test("nothing or else", () => {
    const m: Maybe<number> = nothing;
    expect(m.orElse(just(13))).toEqual(just(13));
    expect(m.orElse(nothing)).toEqual(nothing);
});

test("just or else supply", () => {
    expect(just(1).orElseSupply(() => just(13))).toEqual(just(1));
});

test("nothing or else supply", () => {
    const m: Maybe<number> = nothing;
    expect(m.orElseSupply(() => just(13))).toEqual(just(13));
    expect(m.orElseSupply(() => nothing)).toEqual(nothing);
});

test("just map", () => {
    expect(just(1).map(i => i + 1).withDefault(10)).toBe(2);
    expect(just(1).map(i => i + 1).map(i => i + 2).withDefault(10)).toBe(4);
});

test("nothing map", () => {
    const n: Maybe<number> = nothing;
    expect(n.map(i => i + 1).withDefault(10)).toBe(10);
    expect(n.map(i => i + 1).map(i => i + 2).withDefault(10)).toBe(10);
});

test("switch nothing", () => {
    const m: Maybe<number> = nothing;
    switch (m.type) {
        case "Just":
            fail("expected nothing");
            break;
        case "Nothing":
            // all good !
            break;
    }
});


test("switch just", () => {
    const m: Maybe<number> = just(1);
    switch (m.type) {
        case "Just":
            expect(m.value).toBe(1);
            break;
        case "Nothing":
            fail("expected a Just");
            break;
    }
});

test("map2", () => {
    // both maybe are 'just', result is 'just'
    expect(map2(just(10), just(20), ((a, b) => a + b))).toEqual(just(30));
    // one of the maybes is 'nothing', result is 'nothing'
    expect(map2(just(10), nothing, ((a, b) => a + b))).toEqual(nothing);
    expect(map2(nothing, just(10), ((a, b) => a + b))).toEqual(nothing);
});


test("To native", () => {
    const obj = { groovy: "baby"};
    let mbObj = just(obj);
    expect(mbObj.toNative()).toEqual(obj)
    mbObj = nothing;
    expect(mbObj.toNative()).toEqual(undefined)
})
