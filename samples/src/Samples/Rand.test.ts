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

import { view, Msg, update, init } from "./Rand";
import { shallow } from 'enzyme';
import { Nothing, nothing, just, Cmd, Task } from "../../../src/TeaCup";



describe("Test Rand", () => {

    describe("init state", () => {

        test("triggers message", () => {
            const [state, cmd] = init();
            expect(state).toEqual(nothing);
            expect(cmd).not.toEqual(Cmd.none);
        });

    });

    describe("view state", () => {

        const noop = () => { }

        test("render nothing", () => {
            const wrapper = shallow(view(noop, nothing))
            expect(wrapper.find('div > p')).toHaveText('This is a random number :');
        });

        test("render something", () => {
            const wrapper = shallow(view(noop, just(13)));
            expect(wrapper.find('div > p')).toIncludeText('13');
        });

        test("render button", () => {
            const wrapper = shallow(view(noop, just(13)));
            expect(wrapper.find('div > p')).toIncludeText('13');
            expect(wrapper.find('div > button')).toHaveLength(1);
            expect(wrapper.find('div > button')).toHaveText('Randomize');
        });

        test("snapshot nothing", () => {
            const wrapper = shallow(view(noop, nothing))
            expect(wrapper).toMatchSnapshot();
        });

        test("snapshot", () => {
            const wrapper = shallow(view(noop, just(13)))
            expect(wrapper).toMatchSnapshot();
        });
    });

    describe("clicks generate messages", () => {
    });

    describe("messages update state", () => {
    });

});

