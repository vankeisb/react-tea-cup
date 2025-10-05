import { describe, expect, test } from 'vitest';
import { Cmd, Dispatcher, Maybe, noCmd, nothing, Result, Sub, Task } from 'tea-cup-fp';
import { Program } from './Program';
import { render, screen, waitFor } from '@testing-library/react';
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
  test('init should be called once', async () => {
    let initCount = 0;
    const myInit = () => {
      initCount++;
      return init();
    };
    const p = <Program init={myInit} view={(_d, m) => view(m)} update={update} subscriptions={subscriptions} />;
    render(p);
    expect(initCount).toBe(1);
    await delayed(2000, () => {
      expect(initCount).toBe(1);
    });
  });

  interface MvuExpectations {
    initCount1: number;
    initCount2: number;
    viewCount1: number;
    viewCount2: number;
    updateCount1: number;
    updateCount2: number;
    subsCount1: number;
    subsCount2: number;
  }

  async function doTest(strictMode: boolean, expectations: MvuExpectations) {
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
    const { container } = render(p, { reactStrictMode: strictMode });
    expect(container.querySelector('#tmpid')?.textContent).toEqual('tmpid,false');
    expect(initCount).toBe(expectations.initCount1);
    expect(viewCount).toBe(expectations.viewCount1);
    expect(updateCount).toBe(expectations.updateCount1);
    expect(subsCount).toBe(expectations.subsCount1);
    await expect
      .poll(() => container.querySelector('#myid')?.textContent, { timeout: 2000, interval: 500 })
      .toEqual('myid,true');
    expect(container.querySelector('#myid')?.textContent).toEqual('myid,true');
    expect(initCount).toBe(expectations.initCount2);
    expect(viewCount).toBe(expectations.viewCount2);
    expect(updateCount).toBe(expectations.updateCount2);
    expect(subsCount).toBe(expectations.subsCount2);
  }

  test('init/update/view/subs count', async () => {
    await doTest(false, {
      initCount1: 1,
      viewCount1: 1,
      updateCount1: 0,
      subsCount1: 1,
      initCount2: 1,
      viewCount2: 3,
      updateCount2: 2,
      subsCount2: 3,
    });
  });

  test('init/update/view/subs count strict', async () => {
    await doTest(true, {
      initCount1: 2,
      viewCount1: 2,
      updateCount1: 0,
      subsCount1: 2,
      initCount2: 2,
      viewCount2: 6,
      updateCount2: 2,
      subsCount2: 4,
    });
  });
});

function delayed(ms: number, f: () => void): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      f();
      resolve();
    }, ms);
  });
}
