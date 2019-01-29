"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function Ok(r) {
    return {
        type: "ok",
        value: r
    };
}
exports.Ok = Ok;
function Err(e) {
    return {
        type: "err",
        value: e
    };
}
exports.Err = Err;
