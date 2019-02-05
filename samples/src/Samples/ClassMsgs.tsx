import {Cmd, Dispatcher, noCmd} from "react-tea-cup";
import * as React from 'react'


export type Model = number


export interface Msg {
    execute: (model: Model) => [Model, Cmd<Msg>]
}

class Add implements Msg {

    private readonly v: number;

    constructor(v?: number) {
        this.v = v || 1;
    }

    execute(model: Model): [Model, Cmd<Msg>] {
        return noCmd(model + this.v)
    }
}


class Times2 implements Msg {
    execute(model: Model): [Model, Cmd<Msg>] {
        return noCmd(model * 2)
    }
}


export function view(dispatch: Dispatcher<Msg>, model: Model) {

    const btn = (s: string, m:Msg) => <button onClick={_ => dispatch(m)}>{s}</button>;

    return (
        <div>
            <p>My messages contain the update logic ! This is more OOP...</p>
            <p>
                Value = {model}
            </p>
            {btn("add", new Add())}
            {btn("remove", new Add(-1))}
            {btn("add 10", new Add(10))}
            {btn("remove 10", new Add(-10))}
            {btn("times 2", new Times2())}
        </div>
    )
}


export function update(msg: Msg, model: Model) {
    return msg.execute(model)
}


export function init(): [Model, Cmd<Msg>] {
    return noCmd(0)
}

