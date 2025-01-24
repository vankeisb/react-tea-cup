/*
 * MIT License
 *
 * Copyright (c) 2019 Rémi Van Keisbelck
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

import { view, Msg, update, init } from './TimeSample';
import { Testing } from 'react-tea-cup';
import { Cmd } from 'tea-cup-core';
import { describe, test, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';

const testing = new Testing<Msg>();

describe('Test TimeSample', () => {
  describe('init state', () => {
    test('triggers no message', () => {
      const [_state, cmd] = init();
      expect(cmd).toEqual(Cmd.none());
    });
  });

  describe('view state', () => {
    const [initialState] = init();

    describe('render initial state', () => {
      test('current time', () => {
        const { container } = render(view(testing.noop, initialState));

        expect(container.querySelectorAll('div span').item(0).textContent).toEqual('Current time : -1');
        expect(container.querySelectorAll('div > button').item(0).textContent).toEqual('Get current time');
      });

      test('trigger in', () => {
        const { container } = render(view(testing.noop, initialState));

        expect(container.querySelectorAll('div span').item(1).textContent).toEqual('In : false');
        expect(container.querySelectorAll('div > button').item(1).textContent).toEqual('Trigger in');
      });

      test('ticks', () => {
        const { container } = render(view(testing.noop, initialState));

        expect(container.querySelectorAll('div span').item(2).textContent).toEqual('Ticks1 : 0, ticks2 : 0');
        expect(container.querySelectorAll('div > button').item(2).textContent).toEqual('start ticking');
      });

      test('snapshot initial', () => {
        const { container } = render(view(testing.noop, initialState));
        expect(container).toMatchSnapshot();
      });
    });

    describe('render some state', () => {
      const state1 = {
        ...initialState,
        currentTime: 1313,
        inTime: true,
        inProgress: false,
        ticking: true,
        ticks1: 13,
        ticks2: 131313,
      };

      const state2 = {
        ...state1,
        inProgress: true,
      };

      test('current time', () => {
        const { container } = render(view(testing.noop, state1));
        expect(container.querySelectorAll('div span').item(0).textContent).toEqual('Current time : 1313');
      });

      test('trigger in', () => {
        const { container } = render(view(testing.noop, state1));
        expect(container.querySelectorAll('div span').item(1).textContent).toEqual('In : true');
      });

      test('trigger in progress', () => {
        const { container } = render(view(testing.noop, state2));
        expect(container.querySelectorAll('div span').item(1).textContent).toEqual('In : ...');
      });

      test('ticks', () => {
        const { container } = render(view(testing.noop, state1));
        expect(container.querySelectorAll('div span').item(2).textContent).toEqual('Ticks1 : 13, ticks2 : 131313');
        expect(container.querySelectorAll('div > button').item(2).textContent).toEqual('stop ticking');
      });

      test('snapshot state1', () => {
        const { container } = render(view(testing.noop, state1));
        expect(container).toMatchSnapshot();
      });

      test('snapshot state2', () => {
        const { container } = render(view(testing.noop, state2));
        expect(container).toMatchSnapshot();
      });
    });
  });

  describe('clicking generates messages', () => {
    const [initialState] = init();

    test('get current time', () => {
      const { container } = render(view(testing.dispatcher, initialState));
      fireEvent.click(container.querySelectorAll('div > button').item(0));
      expect(testing.dispatched).toEqual({ tag: 'get-cur-time' });
    });

    test('get in', () => {
      const { container } = render(view(testing.dispatcher, initialState));
      fireEvent.click(container.querySelectorAll('div > button').item(1));
      expect(testing.dispatched).toEqual({ tag: 'get-in' });
    });

    test('toggle tick', () => {
      const { container } = render(view(testing.dispatcher, initialState));
      fireEvent.click(container.querySelectorAll('div > button').item(2));
      expect(testing.dispatched).toEqual({ tag: 'toggle-tick' });
    });
  });

  describe('message updates state', () => {
    const [initialState] = init();

    test('get-cur-time', () => {
      const [newState, cmd] = update({ tag: 'get-cur-time' }, initialState);
      expect(newState.currentTime).toBe(-1);
      testing.dispatchFrom(cmd).then((msg) => {
        expect(msg).toHaveProperty('tag', 'got-cur-time');
      });
    });

    test('get-in', () => {
      const [newState, cmd] = update({ tag: 'get-in' }, initialState);
      expect(newState.inTime).toBe(false);
      expect(newState.inProgress).toBe(true);
      testing.dispatchFrom(cmd).then((msg) => {
        expect(msg).toHaveProperty('tag', 'got-in');
      });
    });

    test('toggle-tick', () => {
      const [newState, cmd] = update({ tag: 'toggle-tick' }, initialState);
      expect(newState.ticking).toBe(!initialState.ticking);
      expect(cmd).toEqual(Cmd.none());
    });

    test('got-tick 1', () => {
      const [newState, cmd] = update({ tag: 'got-tick', isFirst: true }, initialState);
      expect(newState.ticks1).toBe(initialState.ticks1 + 1);
      expect(newState.ticks2).toBe(initialState.ticks2);
      expect(cmd).toEqual(Cmd.none());
    });

    test('got-tick 2', () => {
      const [newState, cmd] = update({ tag: 'got-tick', isFirst: false }, initialState);
      expect(newState.ticks1).toBe(initialState.ticks1);
      expect(newState.ticks2).toBe(initialState.ticks2 + 1);
      expect(cmd).toEqual(Cmd.none());
    });
  });
});
