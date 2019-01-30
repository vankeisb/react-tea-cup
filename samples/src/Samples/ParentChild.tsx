import * as Counter from './Counter'
import { Dispatcher, map, Cmd, Sub } from 'react-tea-cup';
import * as React from 'react'

type Model = Array<Counter.Model>

interface Msg { 
    readonly childIndex: number
    readonly childMsg: Counter.Msg
}

export const init = () => {
    return [
        Counter.init(),
        Counter.init(),
        Counter.init()
    ]
}

export const view = (dispatch: Dispatcher<Msg>) => (model: Model) => (
    <div>
        {model.map((counterModel, index) => {
            return Counter.view(
                map(dispatch, cMsg => {
                    return {
                        childIndex: index,
                        childMsg: cMsg            
                    }
                })
            )(counterModel)
        })}
    </div>
)


export function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
    const newModels: Array<Counter.Model> = [];
    const cmds: Array<Cmd<Msg>> = [];
    model.forEach((cModel, cIndex) => {
        if (cIndex === msg.childIndex) {
            const mc = Counter.update(msg.childMsg, cModel);
            newModels.push(mc[0])
            cmds.push(mc[1].map(cMsg => {
                return {
                    childIndex: cIndex,
                    childMsg: cMsg
                }
            }))
        } else {
            newModels.push(cModel)            
        }
    })
    return [ newModels, Cmd.none() ];
}


export const subscriptions = (dispatch: Dispatcher<Msg>) => (model: Model) => {
    return Sub.none<Msg>()
}