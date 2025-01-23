import { Cmd, Dispatcher, Sub } from 'tea-cup-core';
import * as React from 'react';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { DevTools } from './DevTools';
import { DispatchBridge, FProgram } from './FProgram';

/**
 * Props for the ProgramWithNav.
 */
export interface FNavProps<Model, Msg> {
  readonly onUrlChange: (l: Location) => Msg;
  readonly init: (l: Location) => [Model, Cmd<Msg>];
  readonly view: (dispatch: Dispatcher<Msg>, m: Model) => ReactNode;
  readonly update: (msg: Msg, model: Model) => [Model, Cmd<Msg>];
  readonly subscriptions: (model: Model) => Sub<Msg>;
  readonly devTools?: DevTools<Model, Msg>;
}

export function FProgramWithNav<Model, Msg>(props: FNavProps<Model, Msg>) {
  const dispatchBridge = useRef<DispatchBridge<Msg>>(new DispatchBridge());

  useEffect(() => {
    // use bridge to dispatch into program on URL change
    const l = () => {
      if (dispatchBridge.current) {
        const msg = props.onUrlChange(window.location);
        dispatchBridge.current.dispatch(msg);
      }
    };
    window.addEventListener('popstate', l);
    // and cleanup when needed
    return function cleanup() {
      window.removeEventListener('popstate', l);
    };
  });

  return (
    <FProgram
      init={() => props.init(window.location)}
      view={props.view}
      update={props.update}
      subscriptions={props.subscriptions}
      devTools={props.devTools}
      dispatchBridge={dispatchBridge.current}
    />
  );
}
