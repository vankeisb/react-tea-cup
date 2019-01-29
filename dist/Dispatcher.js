"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function map(d, mapper) {
    return (c) => {
        d(mapper(c));
    };
}
exports.map = map;
