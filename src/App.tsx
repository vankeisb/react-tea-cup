import React, {Component, ReactNode} from 'react';
// import './App.css';
import {Program} from './TeaCup/Program'
import {Dispatcher} from "./TeaCup/Dispatcher";
import {Cmd, noCmd} from "./TeaCup/Cmd";
import {random} from "./TeaCup/Random";
import {Task} from "./TeaCup/Task";
import {number} from "prop-types";


interface Model {
    value: number
    enabled: boolean
}


function init() {
    return {
        value: 0,
        enabled: true
    }
}


function view(dispatch: Dispatcher<Msg>, model:Model) {
    return (
        <div>
            Value = {model.value}
            <button
                disabled={!model.enabled}
                onClick={() => dispatch({ type: "inc" }) }>
                +
            </button>
            <button
                disabled={!model.enabled}
                onClick={() => dispatch({ type: "dec"}) }>
                -
            </button>
            <button
                disabled={!model.enabled}
                onClick={() => dispatch({ type: "rand"}) }>
                random
            </button>
            <button
                disabled={!model.enabled}
                onClick={() => dispatch({ type: "timeout"}) }>
                timeout
            </button>
        </div>
    );
}


type Msg
    = Increment
    | Decrement
    | Randomize
    | RandomReceived
    | Timeout
    | TimeoutReceived


interface Increment {
    type: "inc"
}


interface Decrement {
    type: "dec"
}


interface Randomize {
    type: "rand"
}


interface RandomReceived {
    type: "random_received"
    value: number
}


interface Timeout {
    type: "timeout"
}


interface TimeoutReceived {
    type: "timeout_received"
    value: number
}


function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
    switch (msg.type) {
        case "inc":
            return noCmd({ ...model, value: model.value + 1 });
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
    }
}


class MyTimeout extends Cmd<TimeoutReceived> {

    readonly timeoutMs: number;

    constructor(timeoutMs: number) {
        super();
        this.timeoutMs = timeoutMs;
    }

    run(dispatch: Dispatcher<TimeoutReceived>): void{
        setTimeout(() => {
            dispatch({
                type:"timeout_received",
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
