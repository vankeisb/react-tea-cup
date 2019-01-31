import {Task} from "./Task";
import {Result} from "./Result";


test("succeed", done => {
    expectOk(done, Task.succeed(123), 123);
});


test("fail", done => {
    expectErr(done, Task.fail("wtf?"), "wtf?");
});


test("map", done => {
    expectOk(
        done,
        Task.succeed(1).map(i => i + 1),
        2
    )
});


test("mapError", done => {
    expectErr(
        done,
        Task.fail("wtf").mapError(s => s + " is wrong?"),
        "wtf is wrong?"
    )
});


test("andThen", done => {
    expectOk(
        done,
        Task.succeed(1).andThen((i:number) => {
            return Task.succeed(i + 10)
        }),
        11
    );
});


test("more complex stuff", done => {
    expectOk(
        done,
        Task.succeed("hello")
            .map(s => s + " world")
            .andThen(s => Task.succeed(s + " and").map(s => s + " people"))
            .map(s => s + " and dolphins"),
        "hello world and people and dolphins"
    )
});

test("more complex stuff with err", done => {
    expectErr(
        done,
        Task.fail("hello")
            .mapError(s => s + " world")
            .andThen(s => Task.fail(s + " foo")), // this should not appear ! second task never gets executed
        "hello world"
    )
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