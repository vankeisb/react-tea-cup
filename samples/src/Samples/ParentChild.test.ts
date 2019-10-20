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

import { view, Msg, update, init, Model } from "./ParentChild";
import { shallow, mount } from 'enzyme';
import { Nothing, nothing, just, Cmd, Task } from "../../../src/TeaCup";


describe("Test ParentChild", () => {

    describe("init state", () => {

        test("counter model x3", async () => {
            const [state, cmd] = init();
            expect(state).toHaveLength(3);
            // TODO batched Cmd.none() untestable
        });

    });

    describe("view state", () => {

        const noop = () => { }
        const [initialState, _cmd] = init();

        test("snapshot initial", () => {
            const wrapper = mount(view(noop, initialState))
            expect(wrapper).toMatchSnapshot();
        });

        test("three counters", () => {
            const wrapper = mount(view(noop, initialState))
            expect(wrapper.find('.counter')).toHaveLength(3);
        });

    });

    describe("clicking generates messages", () => {
        var captured: Msg | undefined;
        const captureMsg = (msg: Msg) => captured = msg

        beforeEach(() => {
            captured = undefined;
        });

        const [initialState, _cmd] = init();

        test('decrement first child', () => {
            const wrapper = mount(view(captureMsg, initialState))
            wrapper.find('.counter > button').at(0).simulate('click')
            expect(captured).toEqual({
                childIndex: 0,
                childMsg: { type: 'dec' }
            })
        });
    });
});

