import React from 'react';
import { Cmd, Maybe, noCmd, nothing, Result, Sub, Task } from 'tea-cup-fp';
import ReactDOM from 'react-dom/client';
import { DevTools, Program } from 'react-tea-cup';

interface Model {
  readonly id: Maybe<string>;
  readonly dimensions: Maybe<Dimensions>;
}

interface Dimensions {
  readonly w: number;
  readonly h: number;
}

type Msg = { tag: 'got-load'; id: Result<Error, string> } | { tag: 'got-dimensions'; r: Result<Error, Dimensions> };

function gotDimensions(r: Result<Error, Dimensions>): Msg {
  return { tag: 'got-dimensions', r };
}

function init(): [Model, Cmd<Msg>] {
  const cmd: Cmd<Msg> = Task.attempt(
    Task.fromPromise(
      () => new Promise<string>((res) => setTimeout(() => res('myid'), 1000)),
    ),
    (r) => ({ tag: 'got-load', id: r }),
  );
  return [{ id: nothing, dimensions: nothing }, cmd];
}

function view(model: Model) {
  const id = model.id.withDefault('tmpid');
  return (
    <div id={id} style={{ backgroundColor: 'red', height: '30px', width: '200px' }}>
      ID = {id},{model.dimensions.map((d) => 'has dims : ' + JSON.stringify(d)).withDefault('no dims')}
    </div>
  );
}

function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
  switch (msg.tag) {
    case 'got-load': {
      const newModel: Model = {
        ...model,
        id: msg.id.toMaybe(),
      };
      const t: Maybe<Task<Error, HTMLElement>> = msg.id.toMaybe().map((id) =>
        Task.fromLambda(() => {
          const n = document.getElementById(id);
          if (!n) {
            throw new Error('node not found');
          }
          return n;
        }),
      );
      const t2: Maybe<Task<Error, Dimensions>> = t.map((task) =>
        task.map((e) => {
          const r = e.getBoundingClientRect();
          return {
            w: r.width,
            h: r.height,
          };
        }),
      );

      const cmd: Cmd<Msg> = t2.map((task) => Task.attempt(task, gotDimensions)).withDefaultSupply(() => Cmd.none());
      return [newModel, cmd];
    }
    case 'got-dimensions': {
      const newModel: Model = {
        ...model,
        dimensions: msg.r.toMaybe(),
      };
      return noCmd(newModel);
    }
  }
}

function subscriptions(): Sub<Msg> {
  return Sub.none();
}

const devTools = new DevTools<Model, Msg>().setVerbose(true).asGlobal();

const App = () => (
  <React.StrictMode>
    <Program
      init={init}
      view={(_d, model) => view(model)}
      update={update}
      subscriptions={subscriptions}
      {...devTools.getProgramProps()}
    />
  </React.StrictMode>
);

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);

// @ts-ignore
window['unmountApp'] = () => {
  root.unmount();
};
