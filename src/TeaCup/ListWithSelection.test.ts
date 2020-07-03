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

import { ListWithSelection } from './ListWithSelection';

describe('ListWithSelection', () => {
  test('empty', () => {
    const l: ListWithSelection<string> = ListWithSelection.empty();
    expect(l.length()).toBe(0);
  });

  test('no selection', () => {
    const l: ListWithSelection<string> = ListWithSelection.fromArray(['a', 'b', 'c']);
    expect(l.length()).toBe(3);
    expect(l.getSelected().type === 'Nothing').toBe(true);
    expect(l.getSelectedIndex().type === 'Nothing').toBe(true);
  });

  test('selection by index', () => {
    const l: ListWithSelection<string> = ListWithSelection.fromArray(['a', 'b', 'c']).selectIndex(1);
    expect(l.length()).toBe(3);
    expect(l.getSelectedIndex().withDefault(-1)).toBe(1);
    expect(l.isSelected('b')).toBe(true);
  });

  test('to array', () => {
    const l: ListWithSelection<string> = ListWithSelection.fromArray(['a', 'b', 'c']).selectIndex(0);
    expect(l.toArray()).toStrictEqual(['a', 'b', 'c']);
  });
});
