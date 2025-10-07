import { describe, expect, test } from 'vitest';
import { Cmd, Dispatcher, Sub, Task, Time } from 'tea-cup-fp';
import { Program } from './Program';
import { render } from '@testing-library/react';
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

describe('program strict test', () => {
  test('init should be called once', async () => {
    let initCount = 0;
    const myInit = () => {
      initCount++;
      return init();
    };
    render(<Program init={myInit} view={(_d, m) => view(m)} update={update} subscriptions={subscriptions} />, {
      reactStrictMode: true,
    });
    expect(initCount).toBe(1);
    await delayed(2000, () => {
      expect(initCount).toBe(1);
    });
  });

  test('init cmd should not be called twice', async () => {
    let cmdCount = 0;
    class MyCmd extends Cmd<Msg> {
      execute(dispatch: Dispatcher<Msg>): void {
        cmdCount++;
      }
    }
    const cmd: Cmd<Msg> = new MyCmd();
    const myInit: () => [Model, Cmd<Msg>] = () => {
      return [{ value: 'initial' }, cmd];
    };
    render(<Program init={myInit} view={(_d, m) => view(m)} update={update} subscriptions={subscriptions} />, {
      reactStrictMode: true,
    });
    await delayed(0, () => {
      expect(cmdCount).toBe(1);
    });
  });

  test('init should be called once with initial cmd', async () => {
    let initCount = 0;
    const myInit = (): [Model, Cmd<Msg>] => {
      initCount++;
      return [{ value: 'a' }, NowCmd];
    };
    render(<Program init={myInit} view={(_d, m) => view(m)} update={update} subscriptions={subscriptions} />, {
      reactStrictMode: true,
    });
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
    render(<Program init={init} view={myView} update={update} subscriptions={subscriptions} />, {
      reactStrictMode: true,
    });
    await delayed(2000, () => {
      expect(viewCount).toBe(1);
    });
  });

  test('update should not be called if no initial cmd', async () => {
    let updateCount = 0;
    const myUpdate = (msg: Msg, model: Model) => {
      updateCount++;
      return update(msg, model);
    };
    render(<Program init={init} view={(_d, m) => view(m)} update={myUpdate} subscriptions={subscriptions} />, {
      reactStrictMode: true,
    });
    expect(updateCount).toBe(0);
    await delayed(2000, () => {
      expect(updateCount).toBe(0);
    });
  });

  test('update should be called once with initial cmd', async () => {
    const myInit = (): [Model, Cmd<Msg>] => {
      return [{ value: 'a' }, NowCmd];
    };
    let updateCount = 0;
    const myUpdate = (msg: Msg, model: Model) => {
      updateCount++;
      return update(msg, model);
    };
    const { container } = render(
      <Program init={myInit} view={(_d, m) => view(m)} update={myUpdate} subscriptions={subscriptions} />,
      { reactStrictMode: true },
    );
    await expect
      .poll(
        () => {
          return container.querySelector('#foo')?.textContent;
        },
        { timeout: 2000, interval: 500 },
      )
      .toEqual('now');
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
    render(<Program init={init} view={(_d, m) => view(m)} update={update} subscriptions={mySubs} />, {
      reactStrictMode: true,
    });
    await delayed(2000, () => {
      expect(subsCount).toBe(1);
    });
  });

  test('subs should be initialized once and not released without initial cmd', async () => {
    class MySub extends Sub<Msg> {
      initCount: number = 0;
      releaseCount: number = 0;

      protected onInit(): void {
        this.initCount++;
      }

      protected onRelease(): void {
        this.releaseCount++;
      }
    }
    const s = new MySub();
    const mySubs = (_model: Model) => {
      return s;
    };
    const p = <React.StrictMode></React.StrictMode>;
    render(<Program init={init} view={(_d, m) => view(m)} update={update} subscriptions={mySubs} />, {
      reactStrictMode: true,
    });
    await delayed(2000, () => {
      expect(s.initCount).toBe(1);
      expect(s.releaseCount).toBe(0);
    });
  });

  test('subs should be called 2 times with initial cmd', async () => {
    const myInit = (): [Model, Cmd<Msg>] => {
      return [{ value: 'a' }, NowCmd];
    };
    let subsCount = 0;
    const mySubs = (_model: Model) => {
      subsCount++;
      return subscriptions();
    };
    const p = <React.StrictMode></React.StrictMode>;
    const { container } = render(
      <Program init={myInit} view={(_d, m) => view(m)} update={update} subscriptions={mySubs} />,
      { reactStrictMode: true },
    );
    await expect
      .poll(
        () => {
          return container.querySelector('#foo')?.textContent;
        },
        { timeout: 2000, interval: 500 },
      )
      .toEqual('now');
    await delayed(2000, () => {
      expect(subsCount).toBe(2);
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
