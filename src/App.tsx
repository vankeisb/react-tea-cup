import React, {Component} from 'react';
import './App.css';
import {Program} from './TeaCup/Program'
import {Dispatcher, map} from "./TeaCup/Dispatcher";
import {Cmd, noCmd} from "./TeaCup/Cmd";
import {random} from "./TeaCup/Random";
import {Task} from "./TeaCup/Task";
import {MyStatefulComponent} from "./MyStatefulComponent";
import {
    init as childInit,
    view as childView,
    update as childUpdate,
    Model as ChildModel,
    Msg as ChildMsg
} from "./Child"

interface Model {
    value: number
    enabled: boolean
    childModel: ChildModel
}


function init() {
    return {
        value: 0,
        enabled: true,
        childModel: childInit()
    }
}

interface CounterProps {
    dispatch: Dispatcher<Msg>,
    value: number,
    enabled: boolean
}

const Counter = React.memo<CounterProps>((props) => {
    console.log("Counter render");
    return (
        <div>
            <h1>This is TEA with React...</h1>
            <span>Value = {props.value}</span>
            <button
                disabled={!props.enabled}
                onClick={() => props.dispatch({type: "inc"})}>
                +
            </button>
            <button
                disabled={!props.enabled}
                onClick={() => props.dispatch({type: "dec"})}>
                -
            </button>
            <button
                disabled={!props.enabled}
                onClick={() => props.dispatch({type: "rand"})}>
                random
            </button>
            <button
                disabled={!props.enabled}
                onClick={() => props.dispatch({type: "timeout"})}>
                timeout
            </button>
        </div>
    )
}, ((prevProps, nextProps) => {
    return prevProps.value === nextProps.value
        && prevProps.enabled === nextProps.enabled
}));


function view(dispatch: Dispatcher<Msg>, model: Model) {
    return (
        <div>
            <Counter dispatch={dispatch} enabled={model.enabled} value={model.value}/>
            <h2>Some parent-child</h2>
            {
                childView(
                    map(dispatch, toMsg),
                    model.childModel
                )
            }
        </div>
    );
}


function toMsg(sub: ChildMsg): Msg {
    return {
        type: "child_msg",
        m: sub
    }
}


type Msg
    = { type: "inc" }
    | { type: "dec" }
    | { type: "rand" }
    | { type: "random_received", value: number }
    | { type: "timeout" }
    | TimeoutReceived
    | { type: "child_msg", m: ChildMsg }


interface TimeoutReceived {
    type: "timeout_received"
    value: number
}


function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
    switch (msg.type) {
        case "inc":
            return noCmd({...model, value: model.value + 1});
        case "dec":
            return noCmd({...model, value: model.value - 1});
        case "rand":
            const rndTask = random(0, 100);
            const cmd = Task.perform(rndTask, i => {
                return {
                    type: "random_received",
                    value: i
                } as Msg
            });
            return [
                model,
                cmd
            ];
        case "random_received":
            return noCmd({...model, value: msg.value});
        case "timeout":
            return [
                {...model, enabled: false},
                new MyTimeout(1000)
            ];
        case "timeout_received":
            return noCmd({...model, value: msg.value, enabled: true});

        case "child_msg":
            const [m, c] = childUpdate(msg.m, model.childModel);
            return [
                {...model, childModel: m},
                c.map(toMsg)
            ]
    }
}


class MyTimeout extends Cmd<TimeoutReceived> {

    readonly timeoutMs: number;

    constructor(timeoutMs: number) {
        super();
        this.timeoutMs = timeoutMs;
    }

    run(dispatch: Dispatcher<TimeoutReceived>): void {
        setTimeout(() => {
            dispatch({
                type: "timeout_received",
                value: new Date().getTime()
            })
        }, this.timeoutMs)
    }
}


class App extends Component {
    render() {
        return (
            <div className="App">
                <Program init={init} view={view} update={update}/>
            </div>
        );
    }
}

export default App;
