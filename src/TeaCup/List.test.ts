import {List} from "./List";
import {Just, Maybe, Nothing} from "./Maybe";

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
    expect(List.empty().toArray()).toEqual([]);
});


test("head and tail", () => {

    function expectHeadAndTail<T>(l:List<T>, head: Maybe<T>, tail: Array<T>) {
        expect(l.head()).toEqual(head);
        expect(l.tail().toArray()).toEqual(tail);
    }

    expectHeadAndTail(List.empty(), Nothing(), []);
    expectHeadAndTail(List.fromArray(["foo"]), Just("foo"), []);
    expectHeadAndTail(List.fromArray([1, 2]), Just(1), [2]);
    expectHeadAndTail(List.fromArray([true, true, false]), Just(true), [true, false]);
});


test("map", () => {
    const l: List<number> = List.fromArray([1, 2, 3]);
    expect(l.map((i:number) => i + 1)).toEqual(List.fromArray([2, 3, 4]))
});

