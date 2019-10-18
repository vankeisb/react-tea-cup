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

import { view, Msg, update, init, Model } from "./Rest";
import { shallow, mount } from 'enzyme';
import { Nothing, nothing, just, Cmd, Task } from "../../../src/TeaCup";


describe("Test Rest", () => {

    describe("init state", () => {

        test("triggers message", () => {
            const [state, cmd] = init();
            expect(cmd).not.toEqual(Cmd.none());
        });

    });

    describe("view state", () => {

        const noop = () => { }
        const [initialState, _cmd] = init();

        test("snapshot initial", () => {
            const wrapper = mount(view(noop, initialState))
            expect(wrapper).toMatchSnapshot();
        });

        test("snapshot loaded", () => {
            const loaded: Model = {
                tag: "loaded",
                commits: [{ sha: "13131313", author: "Toto" }]
            }
            const wrapper = mount(view(noop, loaded))
            expect(wrapper).toMatchSnapshot();
        });

        test("snapshot error", () => {
            const errored: Model = {
                tag: "load-error",
                error: new Error('boom')
            }
            const wrapper = mount(view(noop, errored))
            expect(wrapper).toMatchSnapshot();
        });

    });

    describe("clicking generates messages which update", () => {
        var captured: Msg | undefined;
        const captureMsg = (msg: Msg) => captured = msg

        beforeEach(() => {
            captured = undefined;
        });

        const msgFromCmd = async (cmd: Cmd<Msg>) => {
            return new Promise<Msg>((resolve, reject) => {
                const captureMsg = (msg: Msg) => {
                    resolve(msg);
                };
                cmd.execute(captureMsg);
            });
        }

        test('click list commits', () => {
            const loaded: Model = {
                tag: "loaded",
                commits: [{ sha: "13131313", author: "Toto" }]
            }
            const wrapper = mount(view(captureMsg, loaded));
            wrapper.find('div > button').simulate('click');

            const [newState, cmd] = captured!(loaded)
            expect(newState).toEqual({ tag: 'loading' });
            expect(cmd).not.toEqual(Cmd.none());
        });

        test('click list commits with loading', () => {
            const loaded: Model = {
                tag: "loaded",
                commits: [{ sha: "13131313", author: "Toto" }]
            }
            const wrapper = mount(view(captureMsg, loaded));
            wrapper.find('div > button').simulate('click');

            const [newState, cmd] = captured!(loaded)
            expect(newState).toEqual({ tag: 'loading' });
            expect(cmd).not.toEqual(Cmd.none());

            const mockedCommits = [{ sha: "13131313", commit: { author: { name: "Toto" } } }];

            jest.autoMockOff();
            fetchMock.resetMocks();
            fetchMock.once(JSON.stringify(mockedCommits));

            msgFromCmd(cmd).then((msg: Msg) => {
                const [newState, cmd1] = msg(loaded);
                expect(cmd1).toEqual(Cmd.none());
                expect(newState).toEqual({ tag: 'loaded', commits: [{ sha: '13131313', author: 'Toto' }] })
            })

        });

        test('click errored', () => {
            const errored: Model = {
                tag: "load-error",
                error: new Error('boom')
            }
            const wrapper = mount(view(captureMsg, errored));
            wrapper.find('div > button').simulate('click');

            const [newState, cmd] = captured!(errored)
            expect(newState).toEqual({ tag: 'loading' });
            expect(cmd).not.toEqual(Cmd.none());
        });

    });

});

