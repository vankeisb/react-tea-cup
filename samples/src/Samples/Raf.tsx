import {Dispatcher, Cmd, noCmd, Sub, onAnimationFrame} from 'react-tea-cup'
import * as React from 'react'

interface Model {
    readonly started: boolean
    readonly t: number
}

type Msg
    = { type: "raf", t: number }
    | { type: "toggle" }

export const init = () => {
    return {
        started: false,
        t: 0
    }
};

export const view = (dispatch: Dispatcher<Msg>) => (model: Model) => {
    return (
        <div>
            <span>Time = {model.t}</span>
            <button onClick={_ => dispatch({type:"toggle"})}>
                {model.started ? "Stop" : "Start"}
            </button>
        </div>
    )
};


export function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
    console.log("up", msg, model);
    switch (msg.type) {
        case "toggle":
            return noCmd({...model, started: !model.started})
        case "raf":
            return noCmd({...model, t: msg.t})
    }
}


export const subscriptions = (model:Model) => {
    if (model.started) {
        return onAnimationFrame((t:number) => { return {type:"raf", t:t} as Msg})
    } else {
        return Sub.none<Msg>()
    }
};


class RafSub extends Sub<Msg> {
    run(dispatch: Dispatcher<Msg>): void {

    }
}