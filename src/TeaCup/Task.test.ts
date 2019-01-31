import {Task} from "./Task";
import {number} from "prop-types";
import {Result} from "./Result";

test("succeed", done => {
    const t = Task.succeed(123);
    const cmd = Task.perform(t, i => i);
    cmd.execute(r => {
        expect(r).toBe(123);
        done();
    })
});


function attempt<E,R>(t:Task<E,R>, callback:(r:Result<E,R>) => void) {
    Task.attempt(t, m => m).execute(callback)
}


function perform<R>(t:Task<void,R>, callback:(r:R) => void) {
    Task.perform(t, m => m).execute(callback)
}