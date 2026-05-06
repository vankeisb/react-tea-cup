import { render } from '@testing-library/react';
import { Cmd, noCmd, Port, Sub, Task, Time } from 'tea-cup-fp';
import { describe, expect, test } from 'vitest';
import { Program } from './Program';
import * as React from 'react';

describe('program subs test', () => {
  interface Model {
    readonly tick: number;
  }

  type Msg = { tag: 'got-tick' };

  function init(): [Model, Cmd<Msg>] {
    return noCmd({ tick: 0 });
  }

  function view(model: Model) {
    return <div>{model.tick}</div>;
  }

  let nbTicks = 0;

  function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
    switch (msg.tag) {
      case 'got-tick': {
        nbTicks++;
        const newModel: Model = {
          ...model,
          tick: model.tick + 1,
        };
        return noCmd(newModel);
      }
    }
  }

  function subscriptions(): Sub<Msg> {
    return Time.every(100, () => ({ tag: 'got-tick' }));
  }

  test('shutdown should release subs', () =>
    new Promise<void>((done) => {
      expect(nbTicks).toEqual(0);
      const p = <Program init={init} view={(d_, model) => view(model)} update={update} subscriptions={subscriptions} />;
      const { unmount } = render(p);
      expect(nbTicks).toEqual(0);
      setTimeout(() => {
        unmount();
        const tick1 = nbTicks;
        expect(tick1).toBeGreaterThan(0);
        setTimeout(() => {
          expect(tick1).toEqual(nbTicks);
          done();
        }, 1000);
      }, 2000);
    }));
});

describe('program processing after shutdown test', () => {
  interface Model {
    readonly count: number;
  }

  type Msg = { tag: 'port' } | { tag: 'increment' };

  function init(): [Model, Cmd<Msg>] {
    return noCmd({ count: 0 });
  }

  function view(model: Model) {
    return <div>{model.count}</div>;
  }

  let nbCount = 0;

  function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
    switch (msg.tag) {
      case 'port': {
        const cmd: Cmd<Msg> = Task.attempt(
          Task.fromPromise(async () => {
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(13);
              }, 100);
            });
          }),
          () => ({ tag: 'increment' }),
        );
        return [model, cmd];
      }
      case 'increment': {
        nbCount++;
        const newModel: Model = {
          ...model,
          count: model.count + 1,
        };
        return noCmd(newModel);
      }
    }
  }

  const port = new Port<Msg>();

  function subscriptions(): Sub<Msg> {
    return port.subscribe(() => ({ tag: 'port' }));
  }

  test('discover fixture', () =>
    new Promise<void>((done) => {
      nbCount = 0;
      const p = <Program init={init} view={(d_, model) => view(model)} update={update} subscriptions={subscriptions} />;
      const { unmount } = render(p);
      expect(nbCount).toEqual(0);
      port.send({ tag: 'port' });
      expect(nbCount).toEqual(0);
      setTimeout(() => {
        expect(nbCount).toEqual(1);
        unmount();
        done();
      }, 1000);
    }));

  test('no processing after shutdown', () =>
    new Promise<void>((done) => {
      nbCount = 0;
      const p = <Program init={init} view={(d_, model) => view(model)} update={update} subscriptions={subscriptions} />;
      const { unmount } = render(p);
      expect(nbCount).toEqual(0);
      port.send({ tag: 'port' });
      setTimeout(() => {
        unmount();
        expect(nbCount).toEqual(0);
        setTimeout(() => {
          expect(nbCount).toEqual(0);
          done();
        }, 500);
      }, 0);
    }));
});
