import {Task} from "./Task";
import {Result} from "./Result";


test("succeed", done => {
    expectOk(done, Task.succeed(123), 123);
});


test("fail", done => {
    expectErr(done, Task.fail("wtf?"), "wtf?");
});


function attempt<E,R>(t:Task<E,R>, callback:(r:Result<E,R>) => void) {
    Task.attempt(t, m => m).execute(callback)
}


function perform<R>(t:Task<void,R>, callback:(r:R) => void) {
    Task.perform(t, m => m).execute(callback)
}


function expectOk<R>(done: () => void, t:Task<void,R>, r:R) {
    perform(t, result => {
        expect(result).toBe(r);
        done()
    })
}


function expectErr<E,R>(done: () => void, t:Task<E,R>, e:E) {
    attempt(t, result => {
        if (result.isOk()) {
            fail("expected an error");
        } else {
            expect(result.getError()).toBe(e);
        }
        done()
    })
}