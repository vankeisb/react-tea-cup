import {Either, left, right} from "./Either";


test("left", () => {
    const e: Either<string,number> = left("yeah");
    expect(e.isLeft()).toBe(true);
    expect(e.isRight()).toBe(false);
});

test("right", () => {
    const e: Either<string,number> = right(123);
    expect(e.isLeft()).toBe(false);
    expect(e.isRight()).toBe(true);
});

test("mapLeft", () => {
    const e: Either<string,number> = left("oh");
    const e2: Either<string,number> = e.mapLeft(s => s + " yeah");
    expect(e2.isLeft()).toBe(true);
    expect(e2.isRight()).toBe(false);
    expect(e2.match(s => s, () => "")).toBe("oh yeah");
});


test("mapRight", () => {
    const e: Either<string,number> = right(123);
    const e2: Either<string,number> = e.mapRight(i => i + 1);
    expect(e2.isLeft()).toBe(false);
    expect(e2.isRight()).toBe(true);
    expect(e2.match(() => 0, i => i)).toBe(124);
});
