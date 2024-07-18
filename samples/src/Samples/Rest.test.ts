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

import { view, Msg, init, Model } from './Rest';
import { render, fireEvent } from '@testing-library/react';
import { extendJest, Testing } from 'react-tea-cup';
import { Cmd } from 'tea-cup-core';
import * as matchers from '@testing-library/jest-dom/matchers'

extendJest(expect);
const testing = new Testing<Msg>();
expect.extend(matchers)

describe('Test Rest', () => {
  describe('init state', () => {
    test('triggers message', () => {
      const [state, cmd] = init();
      expect(cmd).not.toEqual(Cmd.none());
    });
  });

  describe('view state', () => {
    const [initialState] = init();

    test('snapshot initial', () => {
      const { container } = render(view(testing.noop, initialState));
      expect(container).toMatchSnapshot();
    });

    test('snapshot loaded', () => {
      const loaded: Model = {
        tag: 'loaded',
        commits: [{ sha: '13131313', author: 'Toto' }],
      };
      const { container } = render(view(testing.noop, loaded));
      expect(container).toMatchSnapshot();
    });

    test('snapshot error', () => {
      const errored: Model = {
        tag: 'load-error',
        error: new Error('boom'),
      };
      const { container } = render(view(testing.noop, errored));
      expect(container).toMatchSnapshot();
    });
  });

  describe('clicking generates messages which update', () => {
    test('click list commits', () => {
      const loaded: Model = {
        tag: 'loaded',
        commits: [{ sha: '13131313', author: 'Toto' }],
      };
      const { container } = render(view(testing.dispatcher, loaded));
      fireEvent.click(container.querySelectorAll('div > button').item(0));

      const [newState, cmd] = testing.dispatched!(loaded);
      expect(newState).toEqual({ tag: 'loading' });
      expect(cmd).not.toEqual(Cmd.none());
    });

    test('click list commits with loading', () => {
      const loaded: Model = {
        tag: 'loaded',
        commits: [{ sha: '13131313', author: 'Toto' }],
      };
      const { container } = render(view(testing.dispatcher, loaded));
      fireEvent.click(container.querySelectorAll('div > button').item(0));

      const [newState, cmd] = testing.dispatched!(loaded);
      expect(newState).toEqual({ tag: 'loading' });
      expect(cmd).not.toEqual(Cmd.none());

      const mockedCommits = [{ sha: '13131313', commit: { author: { name: 'Toto' } } }];

      jest.autoMockOff();
      fetchMock.resetMocks();
      fetchMock.once(JSON.stringify(mockedCommits));

      testing.dispatchFrom(cmd).then((msg: Msg) => {
        const [newState, cmd1] = msg(loaded);
        expect(cmd1).toEqual(Cmd.none());
        expect(newState).toEqual({ tag: 'loaded', commits: [{ sha: '13131313', author: 'Toto' }] });
      });
    });

    test('click errored', () => {
      const errored: Model = {
        tag: 'load-error',
        error: new Error('boom'),
      };
      const { container } = render(view(testing.dispatcher, errored));
      fireEvent.click(container.querySelectorAll('div > button').item(0));

      const [newState, cmd] = testing.dispatched!(errored);
      expect(newState).toEqual({ tag: 'loading' });
      expect(cmd).not.toEqual(Cmd.none());
    });
  });
});
