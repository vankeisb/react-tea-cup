import {Dispatcher, Cmd, noCmd, Sub, onAnimationFrame} from 'react-tea-cup'
import * as React from 'react'

export interface Model {
    readonly started: boolean
    readonly t: number
    readonly fps: number
    readonly animText: string
}

export type Msg
    = { type: "raf", t: number }
    | { type: "toggle" }
    | { type: "text-changed", text: string }


export function init() {
    return noCmd<Model,Msg>({
        started: false,
        t: 0,
        fps: 0,
        animText: "This text gets animated..."
    })
}


export function view(dispatch: Dispatcher<Msg>, model: Model) {
    let fps, anim;
    if (model.started) {
        fps = <div>{Math.round(model.fps)} FPS</div>;
        anim = viewAnim(model.animText, model.t);
    }
    return (
        <div>
            <div>
                <input
                    type="text"
                    value={model.animText}
                    onChange={ e =>
                        dispatch({
                            type: "text-changed",
                            text: (e.target as HTMLInputElement).value
                        })
                    }/>
            </div>
            <span>Time = {Math.round(model.t)}</span>
            <button onClick={_ => dispatch({type:"toggle"})}>
                {model.started ? "Stop" : "Start"}
            </button>
            {fps}
            {anim}
        </div>
    )
}


function viewAnim(text: String, t:number) {
    const a = text.split("").map((c, i) => {
        const st = t / 200;
        const y1 = Math.sin(st + (i / 5)) * 5;
        // const y2 = Math.sin(t / 666 + i) * 10;
        const style = {
            // paddingBottom: y + "px",
            // height: "24px",
            // width: "12px"
            "display": "block",
            "white-space": "pre",
            fontSize: 32 + y1 + "px"
        };
        return (
            <div key={i} style={style}>{c}</div>
        )
    });
    const style = {
        display: "flex",
        padding: "12px",
        minHeight: "48px"
    };
    return (
        <div style={style}>{a}</div>
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

        case "text-changed":
            return noCmd({
                ...model,
                animText: msg.text
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
