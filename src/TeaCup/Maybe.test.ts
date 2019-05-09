import {just, map2, Maybe, nothing} from "./Maybe";

test("just with default", () => {
    expect(just(1).withDefault(2)).toBe(1);
});

test("nothing with default", () => {
    const m: Maybe<number> = nothing;
    expect(m.withDefault(1)).toBe(1);
});

test("just map", () => {
    expect(just(1).map(i => i + 1).withDefault(10)).toBe(2);
    expect(just(1).map(i => i + 1).map(i => i + 2).withDefault(10)).toBe(4);
});

test("nothing map", () => {
    const n: Maybe<number> = nothing;
    expect(n.map(i => i + 1).withDefault(10)).toBe(10);
    expect(n.map(i => i + 1).map(i => i + 2).withDefault(10)).toBe(10);
});

test("switch nothing", () => {
    const m: Maybe<number> = nothing;
    switch (m.type) {
        case "Just":
            fail("expected nothing");
            break;
        case "Nothing":
            // all good !
            break;
    }
});


test("switch just", () => {
    const m: Maybe<number> = just(1);
    switch (m.type) {
        case "Just":
            expect(m.value).toBe(1);
            break;
        case "Nothing":
            fail("expected a Just");
            break;
    }
});

// MAP 2
test("map2", () => {
    // both maybe are 'just', result is 'just'
    expect(map2(just(10), just(20), ((a, b) => a + b))).toEqual(just(30));
    // one of the maybes is 'nothing', result is 'nothing'
    expect(map2(just(10), nothing, ((a, b) => a + b))).toEqual(nothing);
    expect(map2(nothing, just(10), ((a, b) => a + b))).toEqual(nothing);
});
