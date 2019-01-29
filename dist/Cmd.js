"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Cmd {
    static none() {
        return new CmdNone();
    }
    map(mapper) {
        return new CmdMapped(this, mapper);
    }
}
exports.Cmd = Cmd;
class CmdNone extends Cmd {
    run(dispatch) {
        // it's a noop !
    }
}
function noCmd(model) {
    return [model, Cmd.none()];
}
exports.noCmd = noCmd;
class CmdMapped extends Cmd {
    constructor(command, mapper) {
        super();
        this.command = command;
        this.mapper = mapper;
    }
    run(dispatch) {
        this.command.run((m) => {
            return this.mapper(m);
        });
    }
}
