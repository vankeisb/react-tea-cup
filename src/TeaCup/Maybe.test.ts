import {Just, Maybe, Nothing} from "./Maybe";

test("just with default", () => {
    expect(Just(1).withDefault(2)).toBe(1);
});

test("nothing with default", () => {
    expect(Nothing().withDefault(1)).toBe(1);
});

test("of nullable", () => {
    expect(Maybe.of<number>(null).withDefault(1)).toBe(1);
    expect(Maybe.of(123).withDefault(456)).toBe(123)
});

test("just map", () => {
    expect(Just(1).map(i => i + 1).withDefault(10)).toBe(2);
    expect(Just(1).map(i => i + 1).map(i => i + 2).withDefault(10)).toBe(4);
});

test("nothing map", () => {
    const n: Maybe<number> = Nothing();
    expect(n.map(i => i + 1).withDefault(10)).toBe(10);
    expect(n.map(i => i + 1).map(i => i + 2).withDefault(10)).toBe(10);
});

test("is present", () => {
    expect(Just(1).isPresent()).toBeTruthy();
    expect(Just(1).map(i => i + 1).isPresent()).toBeTruthy();
    expect(Nothing().isPresent()).toBeFalsy();
});


test("get", () => {
    expect(Just(1).get()).toBe(1);
    expect(() => Nothing().get()).toThrowError("trying to get value on Nothing")
});


test("match just", () => {
    expect(
        Just(1).match(
            (i:number) => 1,
            () => 2
        )
    ).toBe(1)
});


test("match nothing", () => {
    const n: Maybe<number> = Nothing();
    expect(
        n.match(
            (i:number) => 1,
            () => 2
        )
    ).toBe(2)
});