import {Decode, Decoder} from "./Decode";
import {err, ok} from "./Result";
import {just, nothing} from "./Maybe";
const num = Decode.num;
const field = Decode.field;


test("number", () => {
    expect(num.decodeValue(1)).toEqual(ok(1));
    expect(num.decodeValue("yeah")).toEqual(err("value is not a number : \"yeah\""));
});


test("nullable", () => {
    const d = Decode.nullable(num);
    expect(d.decodeValue(1)).toEqual(ok(just(1)));
    expect(d.decodeValue(null)).toEqual(ok(nothing));
    expect(d.decodeValue("neh")).toEqual(err("value is not a number : \"neh\""))
});


test("field", () => {
    const o = {
        age: 123
    };

    expect(field("age", num).decodeValue(o)).toEqual(ok(123));
    expect(field("neh", num).decodeValue(o)).toEqual(err("path not found [neh] on {\"age\":123}"))
});


test("at", () => {
    const o = {
        foo: {
            bar: "baz"
        }
    };
    expect(Decode.at(["foo", "bar"], Decode.str).decodeValue(o)).toEqual(ok("baz"));
    expect(Decode.at(["foo", "bar", "nope"], Decode.str).decodeValue(o))
        .toEqual(err("path not found [foo,bar,nope] on {\"foo\":{\"bar\":\"baz\"}}"));
    expect(Decode.at(["x"], Decode.str).decodeValue(o))
        .toEqual(err("path not found [x] on {\"foo\":{\"bar\":\"baz\"}}"))
});


test("maybe", () => {
    const o = {
        name: "tom",
        age: 42
    };

    const maybe = Decode.maybe;
    expect(maybe(field("age", num)).decodeValue(o)).toEqual(ok(just(42)));
    expect(maybe(field("name", num)).decodeValue(o)).toEqual(ok(nothing));
    expect(maybe(field("height", num)).decodeValue(o)).toEqual(ok(nothing));

    expect(field("age", maybe(num)).decodeValue(o)).toEqual(ok(just(42)));
    expect(field("name", maybe(num)).decodeValue(o)).toEqual(ok(nothing));
    expect(field("height", maybe(num)).decodeValue(o)).toEqual(err("path not found [height] on {\"name\":\"tom\",\"age\":42}"))
});


test("map", () => {
    expect(Decode.map((s:string) => s.length, Decode.str).decodeValue("foo")).toEqual(ok(3));

});

test("map2", () => {
    const point: Decoder<number[]> =
        Decode.map2(
            (x:number, y:number) => [x,y],
            field("x", num),
            field("y", num)
        );

    expect(point.decodeValue({x:1,y:2})).toEqual(ok([1,2]));
    expect(point.decodeValue({x:1})).toEqual(err("path not found [y] on {\"x\":1}"));
    expect(point.decodeValue({y:1})).toEqual(err("path not found [x] on {\"y\":1}"));
    expect(point.decodeValue({foo:1})).toEqual(err("path not found [x] on {\"foo\":1}"));
});


test("map3", () => {
    const point: Decoder<number[]> =
        Decode.map3(
            (x:number, y:number, z:number) => [x,y,z],
            field("x", num),
            field("y", num),
            field("z", num)
        );

    expect(point.decodeValue({x:1,y:2,z:3})).toEqual(ok([1,2,3]));
    expect(point.decodeValue({x:1})).toEqual(err("path not found [y] on {\"x\":1}"));
});


test("andThen", () => {

    type Stuff
        = { readonly tag: "stuff1", readonly foo: string }
        | { readonly tag: "stuff2", readonly bar: string }


    const stuff: Decoder<Stuff> =
        Decode.andThen(
            stuffHelp,
            field("tag", Decode.str)
        );

    function stuffHelp(tag: string): Decoder<Stuff> {
        switch (tag) {
            case "stuff1":
                return stuff1Decoder;
            case "stuff2":
                return stuff2Decoder;
            default:
                return Decode.fail("unknown stuff " + tag);
        }

    }

    const stuff1Decoder:Decoder<Stuff> = Decode.map(
        (foo: string) => {
            return {
                tag: "stuff1",
                foo: foo
            } as Stuff
        },
        Decode.field("foo", Decode.str)
    );

    const stuff2Decoder: Decoder<Stuff> = Decode.map(
        (bar: string) => {
            return {
                tag: "stuff2",
                bar: bar
            } as Stuff
        },
        Decode.field("bar", Decode.str)
    );

    const s1: any = {
        tag: "stuff1",
        foo: "bar"
    };

    const s2:any = {
        tag: "stuff2",
        bar: "baz"
    };


    expect(stuff.decodeValue(s1)).toEqual(ok(s1));

    expect(stuff.decodeValue(s2)).toEqual(ok(s2));

    expect(stuff.decodeValue({
        tag: "wtf", blah:"blah"
    })).toEqual(err("unknown stuff wtf"));

    expect(stuff.decodeValue({
        tag:"stuff1", notThere: true
    })).toEqual(err("path not found [foo] on {\"tag\":\"stuff1\",\"notThere\":true}"))

});


test("lazy", () => {

    interface Comment {
        readonly message: string
        readonly responses: ReadonlyArray<Comment>
    }

    const comment: Decoder<Comment> = Decode.map2(
        (message:string,responses:Comment[]) => {
            return {
                message: message,
                responses: responses
            } as Comment
        },
        field("message", Decode.str),
        field("responses", Decode.array(Decode.lazy(() => comment)))
    );

    const v = {
        message: "hello",
            responses: [
                {
                    message: "there",
                    responses: []
                },
                {
                    message: "world",
                    responses: []
                }
            ]
    };

    expect(comment.decodeValue(v)).toEqual(ok(v));

});