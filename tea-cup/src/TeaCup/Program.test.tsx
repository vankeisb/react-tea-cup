import { describe, expect, test } from 'vitest';
import { Cmd, Maybe, noCmd, nothing, Result, Sub, Task } from 'tea-cup-fp';
import { Program } from 'react-tea-cup';
import { render } from '@testing-library/react';
import * as React from 'react';

interface Model {
  readonly id: Maybe<string>;
  readonly other: boolean;
}

type Msg = { tag: 'got-load'; id: Result<Error, string> } | { tag: 'got-other' };

function init(): [Model, Cmd<Msg>] {
  const cmd: Cmd<Msg> = Task.attempt(
    Task.fromPromise(
      () => new Promise<string>((res) => setTimeout(() => res('myid'), 1000)),
    ),
    (r) => ({ tag: 'got-load', id: r }),
  );
  return [{ id: nothing, other: false }, cmd];
}

function view(model: Model) {
  const id = model.id.withDefault('tmpid');
  return (
    <div id={id} style={{ backgroundColor: 'red', height: '30px', width: '200px' }}>
      {id},{model.other ? 'true' : 'false'}
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
      const t2: Maybe<Task<Error, boolean>> = t.map((task) =>
        task.map((e) => {
          return true;
        }),
      );

      const msgOther: Msg = { tag: 'got-other' };
      const cmd: Cmd<Msg> = t2.map((task) => Task.attempt(task, () => msgOther)).withDefaultSupply(() => Cmd.none());
      return [newModel, cmd];
    }
    case 'got-other': {
      const newModel: Model = {
        ...model,
        other: true,
      };
      return noCmd(newModel);
    }
  }
}

function subscriptions(): Sub<Msg> {
  return Sub.none();
}

describe('program test', () => {
  test('view should be called after each update', () =>
    new Promise<void>((done) => {
      const p = <Program init={init} view={(_d, m) => view(m)} update={update} subscriptions={subscriptions} />;
      const { container } = render(p);
      expect(container.querySelector('#tmpid')?.textContent).toEqual('tmpid,false');
      setTimeout(() => {
        expect(container.querySelector('#myid')?.textContent).toEqual('myid,true');
        done();
      }, 3000);
    }));
});
