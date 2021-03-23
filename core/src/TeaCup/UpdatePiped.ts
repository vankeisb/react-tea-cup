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

export type UpdateFunction<Model, Msg> = GenericUpdateFunction<Model, Cmd<Msg>>;

/**
 * Piped updates.
 * Useful for chaining building blocks making up the update loop.
 */
export function updatePiped<Model, Msg>(
  model: Model,
  ...updates: readonly UpdateFunction<Model, Msg>[]
): [Model, Cmd<Msg>] {
  const none: Cmd<Msg> = Cmd.none();
  const combine = (cmd1: Cmd<Msg>, cmd2: Cmd<Msg>) => {
    const none1 = isNone(cmd1);
    const none2 = isNone(cmd2);
    return none1 && none2 ? cmd1 : none1 ? cmd2 : none2 ? cmd1 : Cmd.batch([cmd1, cmd2]);
  };
  return genericUpdatePiped(combine, none, model, ...updates);
}

function isNone<Msg>(cmd: Cmd<Msg>): boolean {
  return cmd.constructor.name === 'CmdNone';
}

export type GenericUpdateFunction<Model, Cmd> = (model: Model) => [Model, Cmd];

/**
 * Generic implementation of chained updates.
 * See updatePiped().
 */
export function genericUpdatePiped<Model, Cmd>(
  combine: (cmd1: Cmd, cmd2: Cmd) => Cmd,
  none: Cmd,
  model: Model,
  ...updates: readonly GenericUpdateFunction<Model, Cmd>[]
): [Model, Cmd] {
  return updates.reduce<[Model, Cmd]>(
    (acc: [Model, Cmd], update: GenericUpdateFunction<Model, Cmd>) => {
      const [model0, cmd0] = acc;
      const [model1, cmd1] = update(model0);
      return [model1, combine(cmd0, cmd1)];
    },
    [model, none],
  );
}
