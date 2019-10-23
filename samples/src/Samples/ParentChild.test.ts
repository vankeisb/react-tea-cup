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
import { mount } from 'enzyme';
import { extendJest, Testing } from "./Testing";

extendJest(expect);
const testing = new Testing<Msg>();


describe("Test ParentChild", () => {

    describe("init state", () => {

        test("counter model x3", async () => {
            const [state, cmd] = init();
            expect(state).toHaveLength(3);
            // TODO batched Cmd.none() untestable
        });

    });

    describe("view state", () => {

        const [initialState, _cmd] = init();

        test("snapshot initial", () => {
            const wrapper = mount(view(testing.noop, initialState))
            expect(wrapper).toMatchSnapshot();
        });

        test("three counters", () => {
            const wrapper = mount(view(testing.noop, initialState))
            expect(wrapper.find('.counter')).toHaveLength(3);
        });

    });

    describe("clicking generates messages", () => {

        const [initialState, _cmd] = init();

        test('decrement first child', () => {
            const wrapper = mount(view(testing.dispatcher, initialState))
            wrapper.find('.counter > button').at(0).simulate('click')
            expect(testing).toHaveDispatchedMsg({
                childIndex: 0,
                childMsg: { type: 'dec' }
            })
        });
    });

    describe("messages update state", () => {

        const [initialState, _cmd] = init();

        test("decrement first counter", () => {
            const [newState, cmd] = update({
                childIndex: 0,
                childMsg: { type: 'dec' }
            }, initialState);
            expect(newState[0]).toBe(initialState[0] - 1);
            expect(newState[1]).toBe(initialState[1]);
            expect(newState[1]).toBe(initialState[2]);
        });

    });

});

