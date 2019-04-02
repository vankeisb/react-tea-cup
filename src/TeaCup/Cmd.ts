import {Dispatcher} from "./Dispatcher";

/**
 * Base class for Commands.
 */
export abstract class Cmd<Msg> {

    /**
     * Create a command that does nothing
     */
    static none<Msg>(): Cmd<Msg> {
        return new CmdNone();
    }

    /**
     * Batches passed commands into a single command.
     * @param cmds the commands to batch
     */
    static batch<Msg>(cmds: Array<Cmd<Msg>>): Cmd<Msg> {
        return new BatchCmd(cmds);
    }

    /**
     * Concrete Commands should implement this method,
     * where the actual command work is done.
     * @param dispatch the dispatcher
     */
    abstract execute(dispatch: Dispatcher<Msg>): void;

    /**
     * Map this command, useful for parent-child scenarios.
     * @param mapper
     */
    map<ParentMsg>(mapper: (c:Msg) => ParentMsg): Cmd<ParentMsg> {
        return new CmdMapped(this, mapper);
    }

}


/**
 * A command that does nothing.
 */
class CmdNone<Msg> extends Cmd<Msg> {
    execute(dispatch: Dispatcher<Msg>): void {
        // it's a noop !
    }
}


/**
 * Utility function for transforming an object into a
 * object/Cmd.none() tuple.
 * @param t an object to be paired with a Cmd.none().
 */
export function noCmd<T,Msg>(t:T): [T, Cmd<Msg>] {
    return [ t, Cmd.none() ]
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