"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
function memo(t) {
    return (f) => {
        return React.createElement(Memo, {
            value: t,
            renderer: (x) => {
                return f(x);
            }
        });
    };
}
exports.memo = memo;
class Memo extends React.Component {
    render() {
        return this.props.renderer(this.props.value);
    }
    shouldComponentUpdate(nextProps, nextState, nextContext) {
        return this.props.value !== nextProps.value;
    }
}
