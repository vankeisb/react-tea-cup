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

import {Either, left, right} from "./Either";


test("left", () => {
    const e: Either<string,number> = left("yeah");
    expect(e.isLeft()).toBe(true);
    expect(e.isRight()).toBe(false);
});

test("right", () => {
    const e: Either<string,number> = right(123);
    expect(e.isLeft()).toBe(false);
    expect(e.isRight()).toBe(true);
});

test("mapLeft", () => {
    const e: Either<string,number> = left("oh");
    const e2: Either<string,number> = e.mapLeft(s => s + " yeah");
    expect(e2.isLeft()).toBe(true);
    expect(e2.isRight()).toBe(false);
    expect(e2.match(s => s, () => "")).toBe("oh yeah");
});


test("mapRight", () => {
    const e: Either<string,number> = right(123);
    const e2: Either<string,number> = e.mapRight(i => i + 1);
    expect(e2.isLeft()).toBe(false);
    expect(e2.isRight()).toBe(true);
    expect(e2.match(() => 0, i => i)).toBe(124);
});
