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


import {memoize} from "./Memoize";
import { beforeEach, describe, expect, test } from "vitest";

interface User {
  readonly name: string;
  readonly size: number;
}

describe('memoize function', () => {

  let count = 0;

  function invoke<T,R>(f: (t: T) => R, arg:T, expectedResult: R, expectedCount: number) {
    const r = f(arg);
    expect(r).toEqual(expectedResult);
    expect(count).toEqual(expectedCount);
  }

  beforeEach(() => {
    count = 0;
  })

  test("primitive number", () => {
    const f = memoize((x: number) => {
      count++;
      return x + 1;
    });
    [
      [0, 1, 1],
      [1, 2, 2],
      [1, 2, 2],
      [0, 1, 3],
      [0, 1, 3]
    ].forEach(([v, er, ec]) => {
      invoke(f, v, er, ec);
    });
  });

  test("object ref equality", () => {
    const f_: (user: User) => string = u => {
      count++;
      return u.name + " " + u.size;
    }
    const f = memoize(f_);
    const user: User = {
      name: "John",
      size: 48,
    };
    invoke(f, user, "John 48", 1);
    invoke(f, user, "John 48", 1);
    const user2: User = {
      ...user,
      size: 12,
    };
    invoke(f, user2, "John 12", 2);
    invoke(f, user2, "John 12", 2);
  });

  test("object with compare fn", () => {
    const f_: (user: User) => string = u => {
      count++;
      return u.name + " " + u.size;
    }
    const f = memoize(f_, (o1, o2) => o1.name === o2.name && o1.size === o2.size);
    const user: User = {
      name: "John",
      size: 48,
    };
    invoke(f, user, "John 48", 1);
    invoke(f, { ...user }, "John 48", 1);
    invoke(f, { name: "John", size: 48 }, "John 48", 1);
  });

  test("array ref equals", () => {
    const f_: (a: number[]) => string = a => {
      count++;
      return a.join("_");
    }
    const f = memoize(f_);
    const a = [1, 2, 3];
    invoke(f, a, "1_2_3", 1);
    invoke(f, a, "1_2_3", 1);
    const a2 = [...a, 4];
    invoke(f, a2, "1_2_3_4", 2);
    invoke(f, a2, "1_2_3_4", 2);
  });

});
