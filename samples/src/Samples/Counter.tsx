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

import * as React from "react";
import {Dispatcher, Cmd, Sub, noCmd} from "react-tea-cup";


// model can be anything of course. Here, it
// is just a number...
export type Model = number;

// discriminated unions can be used for Msgs
export type Msg = { type: "inc" } | { type: "dec" };

// init func : creates initial Model (no Cmds at init yet...)
export function init() : [Model, Cmd<Msg>] {
    return noCmd(0)
}

// view : renders the Model. Same as Elm's, but you
// need this "dispatch" arg, so that you can emit Msgs
export function view(dispatch: Dispatcher<Msg>, model: Model) {
    return (
        <div className="counter">
            <button onClick={_ => dispatch({type: "dec"})}>-</button>
            <span>{model}</span>
            <button onClick={_ => dispatch({type: "inc"})}>+</button>
        </div>
    )
}

// update : same as Elm's
export function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
  switch (msg.type) {
    case "inc":
      return [model + 1, Cmd.none()];
    case "dec":
      return [model - 1, Cmd.none()];
  }
}


export function subscriptions(model: Model) {
  return Sub.none<Msg>()
}
