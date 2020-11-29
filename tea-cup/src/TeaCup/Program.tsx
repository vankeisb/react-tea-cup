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

import {Component, ReactNode, useEffect, useRef, useState} from 'react';
import {Dispatcher, Cmd, Sub, nothing, Maybe, just} from 'tea-cup-core';
import { DevToolsEvent, DevTools } from './DevTools';
import * as React from "react";

export class DispatchBridge<Msg> {

  private d?: Dispatcher<Msg>;

  subscribe(d: Dispatcher<Msg>): void {
    this.d = d;
  }

  dispatch(msg: Msg) {
    this.d?.(msg);
  }
}

/**
 * The program props : asks for init, view, update and subs in order
 * to start the TEA MVU loop.
 */
export interface ProgramProps<Model, Msg> {
  init: () => [Model, Cmd<Msg>];
  view: (dispatch: Dispatcher<Msg>, model: Model) => ReactNode;
  update: (msg: Msg, model: Model) => [Model, Cmd<Msg>];
  subscriptions: (model: Model) => Sub<Msg>;
  dispatchBridge?: DispatchBridge<Msg>;
  devTools?: DevTools<Model, Msg>;
}


interface ProgState<Model,Msg> {
  readonly initialCmd?: Cmd<any>;
  readonly currentModel: Model;
  readonly currentSub: Sub<Msg>;
}


export function Program<Model,Msg>(props: ProgramProps<Model, Msg>) {

  const [model, setModel] = useState<Maybe<Model>>(nothing);

  const cmd = useRef<Cmd<Msg>>(Cmd.none());
  const modelRef = useRef(model);
  const sub = useRef<Sub<Msg>>(Sub.none());

  const dispatch = (msg: Msg) => {
    console.log("*** dispatch ***", msg);
    if (modelRef.current.type === 'Just') {
      const m = modelRef.current.value;
      const [uModel, uCmd] = props.update(msg, m);
      modelRef.current = just(uModel);
      cmd.current = uCmd;
      setModel(just(uModel));
      const newSub = props.subscriptions(uModel);
      newSub.init(dispatch);
      sub.current.release();
      sub.current = newSub;
    }
  };

  // init : run once (componentDidMount)
  useEffect(() => {
    if (modelRef.current.isNothing()) {
      console.log("*** init ***");
      const [uModel, uCmd] = props.init();
      setModel(just(uModel));
      modelRef.current = just(uModel);
      cmd.current = uCmd;
      const newSub = props.subscriptions(uModel);
      sub.current = newSub;
      newSub.init(dispatch);
    }
  });

  // executed at every render
  useEffect(() => {
    console.log("*** render ***", cmd.current);
    props.dispatchBridge?.subscribe(dispatch);
    cmd.current.execute(dispatch)
  });

  return <>{model.map(m => props.view(dispatch, m)).toNative()}</>;
}

class Guid {
  static newGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

/**
 * A React component that holds a TEA "program", provides the Dispatcher, and implements the MVU loop.
 */
// export class Program<Model, Msg> extends Component<ProgramProps<Model, Msg>, never> {
//   readonly uuid = Guid.newGuid();
//   private readonly bd: Dispatcher<Msg>;
//   private readonly devTools?: DevTools<Model, Msg>;
//   private count: number = 0;
//   private readonly initialCmd: Cmd<any>;
//   private currentModel: Model;
//   private currentSub: Sub<Msg>;

//   constructor(props: Readonly<ProgramProps<Model, Msg>>) {
//     super(props);
//     this.devTools = this.props.devTools;
//     if (this.devTools) {
//       this.devTools.connected(this);
//     }
//     const mac = (this.devTools && this.devTools.initFromSnapshot()) || props.init();
//     if (this.devTools) {
//       this.fireEvent({
//         tag: 'init',
//         time: new Date().getTime(),
//         model: mac[0],
//       });
//     }
//     const sub = props.subscriptions(mac[0]);
//     this.currentModel = mac[0];
//     this.currentSub = sub;
//     // connect to sub
//     const d = this.dispatch.bind(this);
//     this.bd = d;
//     sub.init(d);
//     this.initialCmd = mac[1];
//   }

//   private fireEvent(e: DevToolsEvent<Model, Msg>) {
//     if (this.devTools) {
//       this.devTools.onEvent(e);
//     }
//   }

//   dispatch(msg: Msg) {
//     if (this.devTools && this.devTools.isPaused()) {
//       // do not process messages if we are paused
//       return;
//     }

//     this.count++;
//     const count = this.count;
//     const currentModel = this.currentModel;
//     const updated = this.props.update(msg, currentModel);
//     if (this.devTools) {
//       this.fireEvent({
//         tag: 'updated',
//         msgNum: count,
//         time: new Date().getTime(),
//         msg: msg,
//         modelBefore: currentModel,
//         modelAfter: updated[0],
//         cmd: updated[1],
//       });
//     }
//     const newSub = this.props.subscriptions(updated[0]);
//     const prevSub = this.currentSub;

//     const d = this.dispatch.bind(this);

//     newSub.init(d);
//     prevSub.release();

//     // perform commands in a separate timout, to
//     // make sure that this dispatch is done
//     setTimeout(() => {
//       // console.log("dispatch: processing commands");
//       // debug("performing command", updated[1]);
//       updated[1].execute(d);
//       // debug("<<<  done");
//     }, 0);

//     this.currentModel = updated[0];
//     this.currentSub = newSub;
//     this.forceUpdate();
//   }

//   componentDidMount() {
//     // trigger initial command
//     setTimeout(() => {
//       this.initialCmd.execute(this.bd);
//     }, 0);
//   }

//   render(): ReactNode {
//     return this.props.view(this.bd, this.currentModel);
//   }

//   setModel(model: Model, withSubs: boolean) {
//     let newSub: Sub<Msg>;
//     if (withSubs) {
//       newSub = this.props.subscriptions(model);
//     } else {
//       newSub = Sub.none();
//     }
//     newSub.init(this.bd);
//     this.currentSub.release();
//     this.currentModel = model;
//     this.currentSub = newSub;
//     this.forceUpdate();
//   }
// }
