import * as React from "react";
// import { Dispatcher, Cmd } from "../TeaCup";


// // model can be anything of course. Here, it
// // is just a number...
// export type Model = number;

// // discriminated unions can be used for Msgs
// export type Msg = { type: "inc" } | { type: "dec" };

// // init func : creates initial Model (no Cmds at init yet...)
// export const init = () => 0;

// // view : renders the Model. Same as Elm's, but you
// // need this "dispatch" arg, so that you can emit Msgs
// export const view = (dispatch: Dispatcher<Msg>) => (model: Model) => (
//   <div className="counter">
//     <h1>
//       <code>react-tea-cup</code> Counter
//     </h1>
//     <p>
//       Hey ! I am a Counter, implemented following The Elm Architecture, in React
//       !
//     </p>
//     <button onClick={_ => dispatch({ type: "dec" })}>-</button>
//     <span>{model}</span>
//     <button onClick={_ => dispatch({ type: "inc" })}>+</button>
//     <p>
//       I'm using the awesome{" "}
//       <a href="https://github.com/vankeisb/react-tea-cup">react-tea-cup</a> lib.
//     </p>
//   </div>
// );

// // update : same as Elm's
// export function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
//   switch (msg.type) {
//     case "inc":
//       return [model + 1, Cmd.none()];
//     case "dec":
//       return [model - 1, Cmd.none()];
//   }
// }