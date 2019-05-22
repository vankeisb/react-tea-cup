import {Component, ReactNode} from 'react';
import {Dispatcher} from "./Dispatcher";
import {Cmd} from "./Cmd";
import { Sub } from './Sub';
import {DevToolsEvent, DevTools} from "./DevTools";


/**
 * The program props : asks for init, view, update and subs in order
 * to start the TEA MVU loop.
 */
export interface ProgramProps<Model,Msg> {
    init: () => [Model, Cmd<Msg>]
    view: (dispatch: Dispatcher<Msg>, model: Model) => ReactNode
    update: (msg: Msg, model: Model) => [Model, Cmd<Msg>]
    subscriptions: (model: Model) => Sub<Msg>
    devTools?: DevTools<Model,Msg>
}

interface ProgramState<Model> {
    currentModel: Model
    currentSub: Sub<any>
}

class Guid {
    static newGuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }
}


/**
 * A React component that holds a TEA "program", provides the Dispatcher, and implements the MVU loop.
 */
export class Program<Model,Msg> extends Component<ProgramProps<Model,Msg>, ProgramState<Model>> {

    readonly uuid = Guid.newGuid();
    private readonly bd: Dispatcher<Msg>;
    private readonly devTools?: DevTools<Model, Msg>;
    private count: number = 0;

    private fireEvent(e:DevToolsEvent<Model,Msg>) {
        if (this.devTools) {
            this.devTools.onEvent(e);
        }
    }

    dispatch(msg:Msg) {

        if (this.devTools && this.devTools.isPaused()) {
            // do not process messages if we are paused
            return;
        }

        this.setState((state, props) => {

            this.count++;
            const count = this.count;
            const currentModel = state.currentModel;
            const updated = props.update(msg, currentModel);
            if (this.devTools) {
                this.fireEvent({
                    tag: "updated",
                    msgNum: count,
                    time: new Date().getTime(),
                    msg: msg,
                    modelBefore: currentModel,
                    modelAfter: updated[0]
                });
            }
            const newSub = props.subscriptions(updated[0]);
            const prevSub = state.currentSub;

            const d = this.dispatch.bind(this);

            newSub.init(d);
            prevSub.release();

            // perform commands in a separate timout, to
            // make sure that this dispatch is done
            setTimeout(() => {
                // console.log("dispatch: processing commands");
                // debug("performing command", updated[1]);
                updated[1].execute(d);
                // debug("<<<  done");
            }, 0);

            return {
                currentModel: updated[0],
                currentSub: newSub
            }
        });
    }

    constructor(props: Readonly<ProgramProps<Model, Msg>>) {
        super(props);
        this.devTools = this.props.devTools;
        if (this.devTools) {
            this.devTools.connected(this);
        }
        const mac = props.init();
        if (this.devTools) {
            this.fireEvent({
                tag: "init",
                time: new Date().getTime(),
                model: mac[0]
            });
        }
        const sub = props.subscriptions(mac[0]);
        this.state = {
            currentModel: mac[0],
            currentSub: sub
        };
        // connect to sub
        const d = this.dispatch.bind(this);
        this.bd = d;
        sub.init(d);
        // trigger initial command
        setTimeout(() => {
            mac[1].execute(d);
        }, 0)
    }

    render(): ReactNode {
        if (this.state.currentModel === undefined) {
            // console.log("render : no model, returning null");
            return null;
        }
        const model = this.state.currentModel;
        // console.log("render : calling view");
        return this.props.view(this.bd, model);
    }

    setModel(model: Model, withSubs: boolean) {
        this.setState((state,props) => {
            let newSub: Sub<Msg>;
            if (withSubs) {
                newSub = this.props.subscriptions(model);
            } else {
                newSub = Sub.none();
            }
            newSub.init(this.bd);
            state.currentSub.release();
            return {
                currentModel: model,
                currentSub: newSub
            }
        });
    }

}