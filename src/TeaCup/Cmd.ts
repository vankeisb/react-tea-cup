import {Dispatcher} from "./Dispatcher";

export abstract class Cmd<Msg> {

    static none<Msg>(): Cmd<Msg> {
        return new CmdNone();
    }

    static batch<Msg>(cmds: Array<Cmd<Msg>>): Cmd<Msg> {
        return new BatchCmd(cmds);
    }

    abstract execute(dispatch: Dispatcher<Msg>): void;

    map<ParentMsg>(mapper: (c:Msg) => ParentMsg): Cmd<ParentMsg> {
        return new CmdMapped(this, mapper);
    }

}


class CmdNone<Msg> extends Cmd<Msg> {
    execute(dispatch: Dispatcher<Msg>): void {
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

    execute(dispatch: Dispatcher<ParentMsg>): void {
        this.command.execute(
            (m:Msg) => {
                dispatch(this.mapper(m))
            }
        )

    }


}


class BatchCmd<Msg> extends Cmd<Msg> {

    private readonly cmds: Array<Cmd<Msg>>;

    constructor(cmds: Array<Cmd<Msg>>) {
        super();
        this.cmds = cmds;
    }

    execute(dispatch: Dispatcher<Msg>): void {
        this.cmds.forEach(cmd => cmd.execute(dispatch));
    }

}