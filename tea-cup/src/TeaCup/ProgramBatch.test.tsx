import { describe, expect, test } from 'vitest';
import { Cmd, Dispatcher, Maybe, noCmd, nothing, Result, Sub, Task } from 'tea-cup-fp';
import { Program } from './Program';
import { render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';

interface Model {
  readonly value: string;
}

type Msg = { tag: 'm1' } | { tag: 'm2' } | { tag: 'm3' } | { tag: 'm4' };

class MyCmd extends Cmd<Msg> {
  constructor(readonly msg: Msg) {
    super();
  }

  execute(dispatch: Dispatcher<Msg>): void {
    setTimeout(() => {
      dispatch(this.msg);
    }, 10);
  }
}

function init(): [Model, Cmd<Msg>] {
  const cmd: Cmd<Msg> = Cmd.batch([new MyCmd({ tag: 'm1' }), new MyCmd({ tag: 'm2' })]);
  return [{ value: '' }, cmd];
}

function view(model: Model) {
  return <div id="foo">{model.value}</div>;
}

function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
  const newModel: Model = { ...model, value: model.value + msg.tag };

  switch (msg.tag) {
    case 'm1': {
      return [newModel, new MyCmd({ tag: 'm3' })];
    }
    case 'm2': {
      return [newModel, new MyCmd({ tag: 'm4' })];
    }
    case 'm3':
      return noCmd(newModel);
    case 'm4':
      return noCmd(newModel);
  }
}

function subscriptions(): Sub<Msg> {
  return Sub.none();
}

describe('program test batch', () => {
  interface MvuExpectations {
    initCount: number;
    viewCount: number;
    updateCount: number;
    subsCount: number;
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
    const { container } = render(strictMode ? <React.StrictMode>{p}</React.StrictMode> : p);
    await expect
      .poll(
        () => {
          return container.querySelector('#foo')?.textContent;
        },
        { timeout: 2000, interval: 500 },
      )
      .toEqual('m1m2m3m4');
    expect(initCount).toBe(expectations.initCount);
    expect(viewCount).toBe(expectations.viewCount);
    expect(updateCount).toBe(expectations.updateCount);
    expect(subsCount).toBe(expectations.subsCount);
  }

  test('init/update/view/subs count', async () => {
    await doTest(false, {
      initCount: 1,
      viewCount: 5,
      updateCount: 4,
      subsCount: 5,
    });
  });

  test('init/update/view/subs count strict', async () => {
    await doTest(true, {
      initCount: 1,
      viewCount: 10,
      updateCount: 4,
      subsCount: 5,
    });
  });
});
