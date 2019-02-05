import * as Counter from './Counter'
import {Dispatcher, map, Cmd, Sub} from 'react-tea-cup';
import * as React from 'react'

export type Model = ReadonlyArray<Counter.Model>

export type Msg = Readonly<{
    childIndex: number
    childMsg: Counter.Msg
}>

export function init() : [Model, Cmd<Msg>] {
    const macs = [
        Counter.init(),
        Counter.init(),
        Counter.init()
    ];
    const models: Array<Counter.Model> = macs.map(mac => mac[0]);
    return [
        models,
        Cmd.batch(
            macs
                .map(mac => mac[1])
                .map((cmd, index) =>
                    cmd.map((c:Counter.Msg) => {
                        return {
                            childIndex: index,
                            childMsg: c
                        }
                    })
                )
        )
    ]
}

export function view(dispatch: Dispatcher<Msg>, model: Model) {
    return (
        <div>
            {model.map((counterModel, index) => {
                return (
                    <div key={index}>
                        {
                            Counter.view(
                                map(dispatch, (cMsg: Counter.Msg) => {
                                    return {
                                        childIndex: index,
                                        childMsg: cMsg
                                    }
                                })
                                , counterModel
                            )
                        }
                    </div>
                )
            })}
        </div>
    )
}


export function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
    const newModels: Array<Counter.Model> = [];
    const cmds: Array<Cmd<Msg>> = [];
    model.forEach((cModel, cIndex) => {
        if (cIndex === msg.childIndex) {
            const mc = Counter.update(msg.childMsg, cModel);
            newModels.push(mc[0]);
            cmds.push(mc[1].map((cMsg: Counter.Msg) => {
                return {
                    childIndex: cIndex,
                    childMsg: cMsg
                }
            }))
        } else {
            newModels.push(cModel)
        }
    });
    return [ newModels, Cmd.batch(cmds) ];
}


export function subscriptions(model: Model) {
    return Sub.batch(
        model.map((cModel, index) =>
            Counter.subscriptions(cModel).map((cMsg: Counter.Msg) => {
                return {
                    childIndex: index,
                    childMsg: cMsg
                }
            })
        )
    )
}