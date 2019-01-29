"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Task_1 = require("./Task");
const Result_1 = require("./Result");
function random(lo, hi) {
    return new RandomTask(lo, hi);
}
exports.random = random;
class RandomTask extends Task_1.Task {
    constructor(lo, hi) {
        super();
        this.lo = lo;
        this.hi = hi;
    }
    run() {
        return Promise.resolve(Result_1.Ok(randomIntFromInterval(this.lo, this.hi)));
    }
}
function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
