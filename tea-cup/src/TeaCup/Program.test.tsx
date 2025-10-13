import { describe, expect, test } from 'vitest';
import { Cmd, Dispatcher, Maybe, noCmd, nothing, Result, Sub, Task } from 'tea-cup-fp';
import { render } from '@testing-library/react';
import * as React from 'react';
import { needsFlush, Program } from './Program';

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
      let initCount = 0;
      let viewCount = 0;
      let updateCount = 0;
      let subsCount = 0;
      const myInit = () => {
        initCount++;
        return init();
      };
      const myView = (_d: Dispatcher<Msg>, m: Model) => {
        viewCount++;
        return view(m);
      };
      const myUpdate = (msg: Msg, model: Model) => {
        updateCount++;
        return update(msg, model);
      };
      const mySubs = (_model: Model) => {
        subsCount++;
        return subscriptions();
      };

      const p = <Program init={myInit} view={myView} update={myUpdate} subscriptions={mySubs} />;
      const { container } = render(p);
      expect(container.querySelector('#tmpid')?.textContent).toEqual('tmpid,false');
      expect(initCount).toBe(1);
      expect(viewCount).toBe(1);
      expect(updateCount).toBe(0);
      expect(subsCount).toBe(1);
      setTimeout(() => {
        expect(container.querySelector('#myid')?.textContent).toEqual('myid,true');
        expect(initCount).toBe(1);
        expect(viewCount).toBe(3);
        expect(updateCount).toBe(2);
        expect(subsCount).toBe(3);
        done();
      }, 3000);
    }));

  test('needs to flush default', () => {
    expect(needsFlush(undefined, undefined)).toBe(true);
    expect(needsFlush(undefined, true)).toBe(true);
    expect(needsFlush(undefined, false)).toBe(false);
    expect(needsFlush(true, undefined)).toBe(true);
    expect(needsFlush(true, true)).toBe(true);
    expect(needsFlush(true, false)).toBe(false);
    expect(needsFlush(false, undefined)).toBe(false);
    expect(needsFlush(false, true)).toBe(true);
    expect(needsFlush(false, false)).toBe(false);
  });
});
