"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
class Program extends react_1.Component {
    constructor(props) {
        super(props);
        // console.log("program ctor : calling init() and setting initial state");
        this.state = {
            currentModel: props.init()
        };
    }
    dispatch(msg) {
        // console.log(">>> dispatch", msg);
        if (this.state.currentModel === undefined) {
            // console.log("<<< dispatch : no model, nothing done");
            return;
        }
        // console.log("dispatch : calling update()");
        const updated = this.props.update(msg, this.state.currentModel);
        // console.log("dispatch : new model obtained, setting state");
        this.setState({
            currentModel: updated[0]
        });
        // console.log("dispatch: processing commands");
        updated[1].run(this.dispatch.bind(this));
        // console.log("dispatch : done");
    }
    render() {
        if (this.state.currentModel === undefined) {
            // console.log("render : no model, returning null");
            return null;
        }
        const model = this.state.currentModel;
        // console.log("render : calling view");
        return this.props.view(this.dispatch.bind(this))(model);
    }
}
exports.Program = Program;
