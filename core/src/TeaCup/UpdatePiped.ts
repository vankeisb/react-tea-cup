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
  return genericUpdatePiped(Cmd.batch, model, ...updates);
}

export type GenericUpdateFunction<Model, Cmd> = (model: Model) => [Model, Cmd];

/**
 * Generic implementation of chained updates.
 * See updatePiped().
 */
export function genericUpdatePiped<Model, Cmd>(
  batch: (cmds: readonly Cmd[]) => Cmd,
  model: Model,
  ...updates: readonly GenericUpdateFunction<Model, Cmd>[]
): [Model, Cmd] {
  const cmd0: Cmd = batch([]);
  return updates.reduce<[Model, Cmd]>(
    (acc: [Model, Cmd], update: GenericUpdateFunction<Model, Cmd>) => {
      const [model0, cmd0] = acc;
      const [model1, cmd1] = update(model0);
      return [model1, batch([cmd0, cmd1])];
    },
    [model, cmd0],
  );
}
