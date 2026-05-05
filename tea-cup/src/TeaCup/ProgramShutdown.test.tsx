import { describe, expect, test } from 'vitest';
import { Cmd, Dispatcher, Maybe, noCmd, nothing, Result, Sub, Task, Time } from 'tea-cup-fp';
import { render } from '@testing-library/react';
import * as React from 'react';
import { needsFlush, Program } from './Program';

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

describe('program subs test', () => {
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
