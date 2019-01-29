"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Cmd_1 = require("./Cmd");
class Task {
    static attempt(t, toMsg) {
        return new TaskCmd(t, toMsg);
    }
    static perform(t, toMsg) {
        return new TaskNoErrCmd(t, toMsg);
    }
}
exports.Task = Task;
class TaskCmd extends Cmd_1.Cmd {
    constructor(task, toMsg) {
        super();
        this.task = task;
        this.toMsg = toMsg;
    }
    run(dispatch) {
        this.task.run().then(r => {
            dispatch(this.toMsg(r));
        });
    }
}
class TaskNoErrCmd extends Cmd_1.Cmd {
    constructor(task, toMsg) {
        super();
        this.task = task;
        this.toMsg = toMsg;
    }
    run(dispatch) {
        this.task.run().then(r => {
            switch (r.type) {
                case "err":
                    // should never happen ???
                    throw Error("got an error from a error-less task ?");
                case "ok":
                    dispatch(this.toMsg(r.value));
            }
        });
    }
}
