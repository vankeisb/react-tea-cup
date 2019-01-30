import {fromNullable, Just, just, Maybe, Nothing, nothing} from "./Maybe";

test("just with default", () => {
    expect(just(1).withDefault(2)).toBe(1);
});

test("nothing with default", () => {
    expect(nothing().withDefault(1)).toBe(1);
});

test("from nullable", () => {
    expect(fromNullable(null).withDefault(1)).toBe(1);
    expect(fromNullable(123).withDefault(456)).toBe(123)
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

test("just cast", () => {
    const m: Maybe<number> = just(1);
    expect(m.type).toBe("just");
    const j: Just<number> = m as Just<number>;
    expect(j.value).toBe(1);
});

test("nothing cast", () => {
    const m: Maybe<number> = nothing();
    expect(m.type).toBe("nothing");
    expect(m).toBeInstanceOf(Nothing);
});
