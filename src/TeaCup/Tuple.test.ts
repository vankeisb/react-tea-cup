import {Tuple} from "./Tuple";

const t = Tuple.t2("foo", 123);


test("values", () => {
    expect(t.a).toBe("foo");
    expect(t.b).toBe(123);
});


test("mapFirst", () => {
    const t2 = t.mapFirst(s => s + "bar");
    expect(t2.a).toBe("foobar");
        expect(t2.b).toBe(123);
});


test("mapSecond", () => {
    const t2 = t.mapSecond(i => i + 1);
    expect(t2.a).toBe("foo");
    expect(t2.b).toBe(124);
});


test("mapBoth", () => {
    const t2 = t.mapBoth(
        s => s + "bar",
        i => i + 1
    );
    expect(t2.a).toBe("foobar");
    expect(t2.b).toBe(124);
});


test("from native", () => {
    const t = Tuple.fromNative(["foo", 123]);
    expect(t.a).toBe("foo");
    expect(t.b).toBe(123);
});