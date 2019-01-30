import * as React from "react";
import { Dispatcher, Cmd, Sub } from "react-tea-cup";


// model can be anything of course. Here, it
// is just a number...
export type Model = number;

// discriminated unions can be used for Msgs
export type Msg = { type: "inc" } | { type: "dec" };

// init func : creates initial Model (no Cmds at init yet...)
export const init = () => 0;

// view : renders the Model. Same as Elm's, but you
// need this "dispatch" arg, so that you can emit Msgs
export const view = (dispatch: Dispatcher<Msg>) => (model: Model) => (
  <div className="counter">
    <button onClick={_ => dispatch({ type: "dec" })}>-</button>
    <span>{model}</span>
    <button onClick={_ => dispatch({ type: "inc" })}>+</button>
  </div>
);

// update : same as Elm's
export function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
  switch (msg.type) {
    case "inc":
      return [model + 1, Cmd.none()];
    case "dec":
      return [model - 1, Cmd.none()];
  }
}


export const subscriptions = (dispatch: Dispatcher<Msg>) => (model: Model) => {
  return Sub.none<Msg>()
}