import {Time} from "./Time";
import {perform} from "./Task.test";

const margin = 10;

test("now", done => {
    const now = new Date().getTime();
    perform(
        Time.now(),
        r => {
            expect(r - now).toBeLessThan(margin);
            done();
        }
    )
});

test("in", done => {
    const now = new Date().getTime();
    const timeout = 500;
    perform(
        Time.in(timeout),
        r => {
            const elapsed = r - now;
            expect(elapsed).toBeLessThan(timeout + margin);
            expect(elapsed).toBeGreaterThanOrEqual(timeout);
            done();
        }
    )
});
