import { mount } from 'enzyme';
import { Cmd, Dispatcher, Sub, Task } from 'tea-cup-core';
import { extendJest, ProgramProps, updateUntilIdle } from 'react-tea-cup';
import React from 'react';

extendJest(expect);

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
    return updateUntilIdle(props, mount).then(([model, wrapper]) => {
      expect(model).toEqual(6);
      // expect(wrapper).toHaveHTML('')
      expect(wrapper.find('.count')).toHaveText('6');
    });
  });
});
