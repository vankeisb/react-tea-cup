import { render } from '@testing-library/react';
import { Cmd, Dispatcher, noCmd, Port, Sub, Task } from 'tea-cup-core';
import { DevTools, extendJest, Program, ProgramProps, updateUntilIdle } from 'react-tea-cup';
import React from 'react';
import * as matchers from '@testing-library/jest-dom/matchers'

extendJest(expect);
expect.extend(matchers)

// const toCmd = (msg: string) => Task.perform(Time.in(0), () => msg);
const toCmd = (msg: string) => Task.perform(Task.succeed(0), () => msg);

describe('Test Program using updateUntilIdle()', () => {
  const init1: () => [number, Cmd<string>] = () => {
    return [0, toCmd('go')];
  };

  const view1: (dispatch: Dispatcher<string>, model: number) => React.ReactNode = (
    dispatch: Dispatcher<string>,
    model: number,
  ) => {
    return <div className={'count'}>{model}</div>;
  };

  const update1: (msg: string, model: number) => [number, Cmd<string>] = (msg: string, model: number) => {
    return [model + 1, model < 5 ? toCmd('go') : Cmd.none()];
  };

  it('expect when program is idle', () => {
    const props: ProgramProps<number, string> = {
      init: init1,
      view: view1,
      update: update1,
      subscriptions: () => Sub.none<string>(),
    };
    return updateUntilIdle(props, e => render(e).container).then(([model, wrapper]) => {
      expect(model).toEqual(6);
      // expect(wrapper).toHaveHTML('')
      expect(wrapper.querySelector('.count')).toHaveTextContent('6');
    });
  });
});

describe('Test Program using DevTools', () => {
  const init1: () => [ReadonlyArray<string>, Cmd<string>] = () => {
    return noCmd([]);
  };

  const view1: (dispatch: Dispatcher<string>, model: ReadonlyArray<string>) => React.ReactNode = (
    dispatch: Dispatcher<string>,
    model: ReadonlyArray<string>,
  ) => {
    return <div className={'history'}>{model.join(' ')}</div>;
  };

  const update1: (msg: string, model: ReadonlyArray<string>) => [ReadonlyArray<string>, Cmd<string>] = (
    msg: string,
    model: ReadonlyArray<string>,
  ) => {
    return noCmd(model.concat([msg]));
  };

  const port1: Port<string> = new Port<string>();

  it('stop dispatching when unmounted', () => {
    const devTools = DevTools.init(window);
    const props: ProgramProps<number, ReadonlyArray<string>> = {
      init: init1,
      view: view1,
      update: update1,
      subscriptions: () => port1.subscribe((msg) => msg),
      devTools,
    };

    const renderResult = render(<Program {...props} />);

    expect(devTools.lastEvent().tag).toEqual('init');
    expect(devTools.lastEvent().model).toEqual([]);
    expect(devTools.lastModel()).toEqual([]);

    port1.send('first');

    expect(devTools.lastEvent().tag).toEqual('updated');
    expect(devTools.lastEvent().msg).toEqual('first');
    expect(devTools.lastModel()).toEqual(['first']);

    port1.send('second');

    expect(devTools.lastEvent().tag).toEqual('updated');
    expect(devTools.lastEvent().msg).toEqual('second');
    expect(devTools.lastModel()).toEqual(['first', 'second']);

    renderResult.unmount();

    port1.send('too-late');

    expect(devTools.lastEvent().tag).toEqual('updated');
    expect(devTools.lastEvent().msg).toEqual('second');
    expect(devTools.lastModel()).toEqual(['first', 'second']);
  });
});
