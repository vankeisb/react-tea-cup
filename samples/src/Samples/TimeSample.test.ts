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
import { mount } from 'enzyme';
import { Testing } from 'react-tea-cup';
import { Cmd } from 'tea-cup-core';
import { describe, test, expect } from "vitest";
import { configure } from 'enzyme';
import EnzymeAdapter from 'enzyme-adapter-react-16';
import 'jsdom-global/register';

const testing = new Testing<Msg>();
configure({ adapter: new EnzymeAdapter() });

describe('Test TimeSample', () => {
  describe('init state', () => {
    test('triggers no message', () => {
      const [state, cmd] = init();
      expect(cmd).toEqual(Cmd.none());
    });
  });

  describe('view state', () => {
    const [initialState, _cmd] = init();

    describe('render initial state', () => {
      test('current time', () => {
        const wrapper = mount(view(testing.noop, initialState));

        expect(wrapper.find('div').at(0).text()).toContain('Current time :');
        expect(wrapper.find('div > button').at(0).text()).toEqual('Get current time');
      });

      test('trigger in', () => {
        const wrapper = mount(view(testing.noop, initialState));

        expect(wrapper.find('div').at(1).text()).toContain('In :');
        expect(wrapper.find('div > button').at(1).text()).toEqual('Trigger in');
      });

      test('ticks', () => {
        const wrapper = mount(view(testing.noop, initialState));

        expect(wrapper.find('div').at(2).text()).toContain('Ticks1 :');
        expect(wrapper.find('div').at(2).text()).toContain(', ticks2 :');
        expect(wrapper.find('div > button').at(2).text()).toEqual('start ticking');
      });

      test('snapshot initial', () => {
        const wrapper = mount(view(testing.noop, initialState));
        expect(wrapper).toMatchSnapshot();
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
        const wrapper = mount(view(testing.noop, state1));
        expect(wrapper.find('div').at(0).text()).toContain('Current time : 1313');
      });

      test('trigger in', () => {
        const wrapper = mount(view(testing.noop, state1));
        expect(wrapper.find('div').at(1).text()).toContain('In :true');
      });

      test('trigger in progress', () => {
        const wrapper = mount(view(testing.noop, state2));
        expect(wrapper.find('div').at(1).text()).toContain('In :...');
      });

      test('ticks', () => {
        const wrapper = mount(view(testing.noop, state1));
        expect(wrapper.find('div').at(2).text()).toContain('Ticks1 : 13');
        expect(wrapper.find('div').at(2).text()).toContain('ticks2 : 131313');
        expect(wrapper.find('div > button').at(2).text()).toContain('stop ticking');
      });

      test('snapshot state1', () => {
        const wrapper = mount(view(testing.noop, state1));
        expect(wrapper).toMatchSnapshot();
      });

      test('snapshot state2', () => {
        const wrapper = mount(view(testing.noop, state2));
        expect(wrapper).toMatchSnapshot();
      });
    });
  });

  describe('clicking generates messages', () => {
    const [initialState, _cmd] = init();

    test('get current time', () => {
      const wrapper = mount(view(testing.dispatcher, initialState));
      wrapper.find('div > button').at(0).simulate('click');
      expect(testing.dispatched).toEqual({ tag: 'get-cur-time' });
    });

    test('get in', () => {
      const wrapper = mount(view(testing.dispatcher, initialState));
      wrapper.find('div > button').at(1).simulate('click');
      expect(testing.dispatched).toEqual({ tag: 'get-in' });
    });

    test('toggle tick', () => {
      const wrapper = mount(view(testing.dispatcher, initialState));
      wrapper.find('div > button').at(2).simulate('click');
      expect(testing.dispatched).toEqual({ tag: 'toggle-tick' });
    });
  });

  describe('message updates state', () => {
    const [initialState, _cmd] = init();

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
