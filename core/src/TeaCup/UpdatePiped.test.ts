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

import { Cmd } from './Cmd';
import { genericUpdatePiped, updatePiped } from './UpdatePiped';
import { describe, expect, test } from "vitest";

describe('UpdatePiped', () => {
  type MyModel = number;
  type MyCmd = readonly string[];

  test('generic', () => {
    const model0: MyModel = 6;
    const [model, cmd] = genericUpdatePiped(
      (cmd1: MyCmd, cmd2: MyCmd) => new Array().concat(...cmd1, ...cmd2),
      [],
      model0,
      (model) => [model + 1, ['add 1']],
      (model) => [model * 6, ['multiply by 6']],
    );
    expect(model).toBe(42);
    expect(cmd).toEqual(['add 1', 'multiply by 6']);
  });

  test('example with none handling', () => {
    type MyMsg = string;
    const model0: MyModel = 6;
    const [model, cmd] = updatePiped(
      model0,
      (model) => [model + 1, Cmd.none()],
      (model) => [model * 6, Cmd.none()],
    );
    expect(model).toBe(42);
    expect(cmd).toEqual(Cmd.none());
  });
});
