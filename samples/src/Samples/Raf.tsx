import {Dispatcher, Cmd, noCmd, Sub, onAnimationFrame} from 'react-tea-cup'
import * as React from 'react'

interface Model {
    readonly started: boolean
    readonly t: number
    readonly fps: number
}

type Msg
    = { type: "raf", t: number }
    | { type: "toggle" }

export function init() {
    return noCmd<Model,Msg>({
        started: false,
        t: 0,
        fps: 0
    })
}

export function view(dispatch: Dispatcher<Msg>, model: Model) {
    let fps;
    if (model.started) {
        fps = <div>{Math.round(model.fps)} FPS</div>
    }
    return (
        <div>
            <span>Time = {model.t}</span>
            <button onClick={_ => dispatch({type:"toggle"})}>
                {model.started ? "Stop" : "Start"}
            </button>
            {fps}
        </div>
    )
}


export function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
    switch (msg.type) {
        case "toggle":
            return noCmd({...model, started: !model.started});
        case "raf":
            const delta = msg.t - model.t;
            const fps = 1000 / delta;
            return noCmd(
                {
                    ...model,
                    t: msg.t,
                    fps: fps
                });
    }
}


export function subscriptions(model:Model) {
    if (model.started) {
        return onAnimationFrame((t:number) => { return {type:"raf", t:t} as Msg})
    } else {
        return Sub.none<Msg>()
    }
}
