import { describe, expect, test } from 'vitest';
import { Cmd, Dispatcher, Sub, Task, Time } from 'tea-cup-fp';
import { Program } from 'react-tea-cup';
import { render, screen } from '@testing-library/react';
import * as React from 'react';

interface Model {
  readonly value: string;
}

type Msg = { tag: 'got-value'; value: string };

function init(): [Model, Cmd<Msg>] {
  return [{ value: 'initial' }, Cmd.none()];
}

function view(model: Model) {
  return <div id="foo">{model.value}</div>;
}

function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
  switch (msg.tag) {
    case 'got-value': {
      const newModel: Model = {
        ...model,
        value: msg.value,
      };
      return [newModel, Cmd.none()];
    }
  }
}

function subscriptions(): Sub<Msg> {
  return Sub.none();
}

const NowCmd: Cmd<Msg> = Task.perform(Time.now(), () => {
  const m: Msg = {
    tag: 'got-value',
    value: 'now',
  };
  return m;
});

describe('program test', () => {
  test('init should not be called twice', async () => {
    let initCount = 0;
    const myInit = () => {
      initCount++;
      return init();
    };
    const p = (
      <React.StrictMode>
        <Program init={myInit} view={(d, m) => view(m)} update={update} subscriptions={subscriptions} />
      </React.StrictMode>
    );
    const { container } = render(p);
    expect(initCount).toBe(1);
    await delayed(2000, () => {
      expect(initCount).toBe(1);
    });
  });

  test('init should not be called twice with initial cmd', async () => {
    let initCount = 0;
    const myInit = (): [Model, Cmd<Msg>] => {
      initCount++;
      return [{ value: 'a' }, NowCmd];
    };
    const p = (
      <React.StrictMode>
        <Program init={myInit} view={(_d, m) => view(m)} update={update} subscriptions={subscriptions} />
      </React.StrictMode>
    );
    const { container } = render(p);
    screen.debug();

    expect(initCount).toBe(1);
    await delayed(2000, () => {
      expect(initCount).toBe(1);
    });
  });

  test('view without cmd', async () => {
    let viewCount = 0;
    const myView = (_d: Dispatcher<Msg>, m: Model) => {
      viewCount++;
      return view(m);
    };
    const p = (
      <React.StrictMode>
        <Program init={init} view={myView} update={update} subscriptions={subscriptions} />
      </React.StrictMode>
    );
    render(p);
    expect(viewCount).toBe(2);
    await delayed(2000, () => {
      expect(viewCount).toBe(2);
    });
  });

  test('update should not be called if no initial cmd', async () => {
    let updateCount = 0;
    const myUpdate = (msg: Msg, model: Model) => {
      updateCount++;
      return update(msg, model);
    };
    const p = (
      <React.StrictMode>
        <Program init={init} view={(_d, m) => view(m)} update={myUpdate} subscriptions={subscriptions} />
      </React.StrictMode>
    );
    render(p);
    expect(updateCount).toBe(0);
    await delayed(2000, () => {
      expect(updateCount).toBe(0);
    });
  });
});

test('update should be called once with initial cmd', async () => {
  let initCount = 0;
  const myInit = (): [Model, Cmd<Msg>] => {
    initCount++;
    return [{ value: 'a' }, NowCmd];
  };
  let updateCount = 0;
  const myUpdate = (msg: Msg, model: Model) => {
    updateCount++;
    return update(msg, model);
  };
  const p = (
    <React.StrictMode>
      <Program init={myInit} view={(_d, m) => view(m)} update={myUpdate} subscriptions={subscriptions} />
    </React.StrictMode>
  );
  const { container } = render(p);
  await expect
    .poll(
      () => {
        return container.querySelector('#foo')?.textContent;
      },
      { timeout: 2000, interval: 500 },
    )
    .toEqual('now');
  expect(initCount).toBe(1);
  expect(updateCount).toBe(1);
  await delayed(2000, () => {
    expect(updateCount).toBe(1);
  });
});

test('subs should be called once without initial cmd', async () => {
  let subsCount = 0;
  const mySubs = (_model: Model) => {
    subsCount++;
    return subscriptions();
  };
  const p = (
    <React.StrictMode>
      <Program init={init} view={(_d, m) => view(m)} update={update} subscriptions={mySubs} />
    </React.StrictMode>
  );
  render(p);
  expect(subsCount).toBe(1);
  await delayed(2000, () => {
    expect(subsCount).toBe(1);
  });
});

test('subs should be called once with initial cmd', async () => {
  const myInit = (): [Model, Cmd<Msg>] => {
    return [{ value: 'a' }, NowCmd];
  };
  let subsCount = 0;
  const mySubs = (_model: Model) => {
    subsCount++;
    return subscriptions();
  };
  const p = (
    <React.StrictMode>
      <Program init={myInit} view={(_d, m) => view(m)} update={update} subscriptions={mySubs} />
    </React.StrictMode>
  );
  const { container } = render(p);
  screen.debug();
  await expect
    .poll(
      () => {
        screen.debug();
        return container.querySelector('#foo')?.textContent;
      },
      { timeout: 2000, interval: 500 },
    )
    .toEqual('now');
  expect(subsCount).toBe(1);
  await delayed(2000, () => {
    expect(subsCount).toBe(1);
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
