import {Dispatcher} from "./Dispatcher";

export abstract class Cmd<Msg> {

    static none<Msg>(): Cmd<Msg> {
        return new CmdNone();
    }

    abstract run(dispatch: Dispatcher<Msg>): void;

}


class CmdNone<Msg> extends Cmd<Msg> {
    run(dispatch: Dispatcher<Msg>): void {
        // it's a noop !
    }
}

export function noCmd<Model,Msg>(model:Model): [Model, Cmd<Msg>] {
    return [ model, Cmd.none() ]
}