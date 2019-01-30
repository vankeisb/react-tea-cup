import React from 'react';
import {Cmd, Dispatcher, Program, map, Sub} from "react-tea-cup";
import * as Counter from './Samples/Counter'
import * as ParentChild from './Samples/ParentChild'
import * as Raf from './Samples/Raf'
import * as Perf from './Samples/Perf'


interface Model {
    readonly counter: Counter.Model
    readonly parentChild: ParentChild.Model
    readonly raf: Raf.Model
    readonly perf: Perf.Model
}


type Msg
    = { type: "counter", child: Counter.Msg }
    | { type: "parentChild", child: ParentChild.Msg }
    | { type: "raf", child: Raf.Msg }
    | { type: "perf", child: Perf.Msg }


function init(): [Model, Cmd<Msg>] {
    const counter = Counter.init();
    const parentChild = ParentChild.init();
    const raf = Raf.init();
    const perf = Perf.init();
    return [
        {
                counter: counter[0],
                parentChild: parentChild[0],
                raf: raf[0],
                perf: perf[0]
        },
        Cmd.batch([
                counter[1].map(mapCounter),
                parentChild[1].map(mapParentChild),
                raf[1].map(mapRaf),
                perf[1].map(mapPerf)
        ])
    ]
}


function mapCounter(m: Counter.Msg) : Msg {
        return {
                type: "counter",
                child: m
        }
}

function mapParentChild(m: ParentChild.Msg) : Msg {
        return {
                type: "parentChild",
                child: m
        }
}

function mapRaf(m: Raf.Msg) : Msg {
        return {
                type: "raf",
                child: m
        }
}

function mapPerf(m: Perf.Msg) : Msg {
        return {
                type: "perf",
                child: m
        }
}


function view(dispatch: Dispatcher<Msg>, model: Model) {
    return (
        <div>
                <h1>Samples</h1>
                <p>
                        This is the samples app for <code>react-tea-cup</code>.
                </p>
                <h2>Counter</h2>
                {Counter.view(map(dispatch, mapCounter), model.counter)}
                <h2>Parent/child</h2>
                {ParentChild.view(map(dispatch, mapParentChild), model.parentChild)}
                <h2>Raf</h2>
                {Raf.view(map(dispatch, mapRaf), model.raf)}
                <h2>Performance</h2>
                {Perf.view(map(dispatch, mapPerf), model.perf)}
        </div>
    )
}


function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
    switch (msg.type) {
        case "counter":
            const macCounter = Counter.update(msg.child, model.counter);
            return [{...model, counter: macCounter[0]}, macCounter[1].map(mapCounter)];
        case "parentChild":
            const macPc = ParentChild.update(msg.child, model.parentChild);
            return [{...model, parentChild: macPc[0]}, macPc[1].map(mapParentChild)];
        case "raf":
            const macRaf = Raf.update(msg.child, model.raf);
            return [{...model, raf: macRaf[0]}, macRaf[1].map(mapRaf)];
        case "perf":
            const macPerf = Perf.update(msg.child, model.perf);
            return [{...model, perf: macPerf[0]}, macPerf[1].map(mapPerf)];
    }

}


function subscriptions(model: Model) : Sub<Msg> {
    return Sub.batch(
        [
            Counter.subscriptions(model.counter).map(mapCounter),
            ParentChild.subscriptions(model.parentChild).map(mapParentChild),
            Raf.subscriptions(model.raf).map(mapRaf),
            Perf.subscriptions(model.perf).map(mapPerf)
        ]
    )
}


const App = () => (
    <Program
        init={init}
        view={view}
        update={update}
        subscriptions={subscriptions}
    />
);

export default App;
