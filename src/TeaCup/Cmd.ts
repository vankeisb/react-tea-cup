import {Dispatcher} from "./Dispatcher";

export abstract class Cmd<Msg> {

    static none<Msg>(): Cmd<Msg> {
        return new CmdNone();
    }

    abstract run(dispatch: Dispatcher<Msg>): void;

    map<ParentMsg>(mapper: (c:Msg) => ParentMsg): Cmd<ParentMsg> {
        return new CmdMapped(this, mapper);
    }

}


class CmdNone<Msg> extends Cmd<Msg> {
    run(dispatch: Dispatcher<Msg>): void {
        // it's a noop !
    }
}

export function noCmd<Model,Msg>(model:Model): [Model, Cmd<Msg>] {
    return [ model, Cmd.none() ]
}


class CmdMapped<Msg, ParentMsg> extends Cmd<ParentMsg> {

    private readonly command: Cmd<Msg>;
    private readonly mapper: (sub:Msg) => ParentMsg;

    constructor(command: Cmd<Msg>, mapper: (sub: Msg) => ParentMsg) {
        super();
        this.command = command;
        this.mapper = mapper;
    }

    run(dispatch: Dispatcher<ParentMsg>): void {
        this.command.run(
            (m:Msg) => {
                return this.mapper(m)
            }
        )

    }


}