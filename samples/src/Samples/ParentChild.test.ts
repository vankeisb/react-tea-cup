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

import { view, Msg, update, init } from './ParentChild';
import { Testing } from 'react-tea-cup';
import { describe, test, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';

const testing = new Testing<Msg>();

describe('Test ParentChild', () => {
  describe('init state', () => {
    test('counter model x3', async () => {
      const [state] = init();
      expect(state).toHaveLength(3);
      // TODO batched Cmd.none() untestable
    });
  });

  describe('view state', () => {
    const [initialState, _cmd] = init();

    test('snapshot initial', () => {
      const { container } = render(view(testing.noop, initialState));
      expect(container).toMatchSnapshot();
    });

    test('three counters', () => {
      const { container } = render(view(testing.noop, initialState));
      expect(container.querySelectorAll('.counter')).toHaveLength(3);
    });
  });

  describe('clicking generates messages', () => {
    const [initialState] = init();

    test('decrement first child', () => {
      const { container } = render(view(testing.dispatcher, initialState));
      fireEvent.click(container.querySelectorAll('.counter > button').item(0));
      expect(testing.dispatched).toEqual({
        childIndex: 0,
        childMsg: { type: 'dec' },
      });
    });
  });

  describe('messages update state', () => {
    const [initialState] = init();

    test('decrement first counter', () => {
      const [newState, _cmd] = update(
        {
          childIndex: 0,
          childMsg: { type: 'dec' },
        },
        initialState,
      );
      expect(newState[0]).toBe(initialState[0] - 1);
      expect(newState[1]).toBe(initialState[1]);
      expect(newState[1]).toBe(initialState[2]);
    });
  });
});
