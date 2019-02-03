import {just, Maybe, nothing} from "./Maybe";

test("just with default", () => {
    expect(just(1).withDefault(2)).toBe(1);
});

test("nothing with default", () => {
    expect(nothing().withDefault(1)).toBe(1);
});

test("just map", () => {
    expect(just(1).map(i => i + 1).withDefault(10)).toBe(2);
    expect(just(1).map(i => i + 1).map(i => i + 2).withDefault(10)).toBe(4);
});

test("nothing map", () => {
    const n: Maybe<number> = nothing();
    expect(n.map(i => i + 1).withDefault(10)).toBe(10);
    expect(n.map(i => i + 1).map(i => i + 2).withDefault(10)).toBe(10);
});

test("switch", () => {
    switch (nothing().type) {
        case "Just":
            fail("expected nothing");
            break;
        case "Nothing":
            // all good !
            break;
    }
});