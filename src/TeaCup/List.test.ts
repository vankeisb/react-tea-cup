import {List} from "./List";

test("list", () => {
    const a = ["foo", "bar", "baz"];
    const l:List<string> = List.fromArray(a);
    expect(l.length()).toBe(3);
    expect(l.toArray()).toEqual(a);
    a[0] = ("mutated");
    expect(l.toArray()).toEqual(["foo", "bar", "baz"]);
});