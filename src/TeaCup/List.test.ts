import {List} from "./List";

test("immutable from array", () => {
    const a = ["foo", "bar", "baz"];
    const l:List<string> = List.fromArray(a);
    expect(l.length()).toBe(3);
    expect(l.toArray()).toEqual(a);
    a[0] = ("mutated");
    expect(l.toArray()).toEqual(["foo", "bar", "baz"]);
});


test("empty list", () => {
    expect(List.empty().length()).toBe(0);
    expect(List.fromArray([])).toEqual(List.empty());
    expect(List.empty().head().isPresent()).toBe(false);
});

