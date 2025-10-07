/*
 * MIT License
 *
 * Copyright (c) 2019 Rémi Van Keisbelck
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

import { Decode, Decoder, DecoderObject } from './Decode';
import { err, ok, Result } from './Result';
import { just, nothing } from './Maybe';
const num = Decode.num;
const field = Decode.field;
import { describe, expect, test } from 'vitest';

test('syntax error', () => {
  expect(num.decodeString(' { broken ')).toEqual(
    err("Expected property name or '}' in JSON at position 3 (line 1 column 4)"),
  );
});

test('primitives', () => {
  expect(num.decodeValue(1)).toEqual(ok(1));
  expect(num.decodeValue('yeah')).toEqual(err('value is not a number : "yeah"'));

  expect(Decode.bool.decodeValue(true)).toEqual(ok(true));
  expect(Decode.bool.decodeValue('boom')).toEqual(err('value is not a boolean : "boom"'));
});

test('nullable', () => {
  const d = Decode.nullable(num);
  expect(d.decodeValue(1)).toEqual(ok(just(1)));
  expect(d.decodeValue(null)).toEqual(ok(nothing));
  expect(d.decodeValue('neh')).toEqual(err('value is not a number : "neh"'));
});

test('field', () => {
  const o = {
    age: 123,
  };

  expect(field('age', num).decodeValue(o)).toEqual(ok(123));
  expect(field('neh', num).decodeValue(o)).toEqual(err('path not found [neh] on {"age":123}'));
});

test('at', () => {
  const o = {
    foo: {
      bar: 'baz',
    },
  };
  expect(Decode.at(['foo', 'bar'], Decode.str).decodeValue(o)).toEqual(ok('baz'));
  expect(Decode.at(['foo', 'bar', 'nope'], Decode.str).decodeValue(o)).toEqual(
    err('path not found [foo,bar,nope] on {"foo":{"bar":"baz"}}'),
  );
  expect(Decode.at(['x'], Decode.str).decodeValue(o)).toEqual(err('path not found [x] on {"foo":{"bar":"baz"}}'));
});

test('maybe', () => {
  const o = {
    name: 'tom',
    age: 42,
  };

  const maybe = Decode.maybe;
  expect(maybe(field('age', num)).decodeValue(o)).toEqual(ok(just(42)));
  expect(maybe(field('name', num)).decodeValue(o)).toEqual(ok(nothing));
  expect(maybe(field('height', num)).decodeValue(o)).toEqual(ok(nothing));

  expect(field('age', maybe(num)).decodeValue(o)).toEqual(ok(just(42)));
  expect(field('name', maybe(num)).decodeValue(o)).toEqual(ok(nothing));
  expect(field('height', maybe(num)).decodeValue(o)).toEqual(err('path not found [height] on {"name":"tom","age":42}'));
});

test('map', () => {
  expect(Decode.map((s: string) => s.length, Decode.str).decodeValue('foo')).toEqual(ok(3));
});

test('map2', () => {
  const point: Decoder<number[]> = Decode.map2((x: number, y: number) => [x, y], field('x', num), field('y', num));

  expect(point.decodeValue({ x: 1, y: 2 })).toEqual(ok([1, 2]));
  expect(point.decodeValue({ x: 1 })).toEqual(err('path not found [y] on {"x":1}'));
  expect(point.decodeValue({ y: 1 })).toEqual(err('path not found [x] on {"y":1}'));
  expect(point.decodeValue({ foo: 1 })).toEqual(err('path not found [x] on {"foo":1}'));
});

test('map3', () => {
  const point: Decoder<number[]> = Decode.map3(
    (x: number, y: number, z: number) => [x, y, z],
    field('x', num),
    field('y', num),
    field('z', num),
  );

  expect(point.decodeValue({ x: 1, y: 2, z: 3 })).toEqual(ok([1, 2, 3]));
  expect(point.decodeValue({ x: 1 })).toEqual(err('path not found [y] on {"x":1}'));
});

test('map8', () => {
  interface My {
    readonly a: number;
    readonly b: number;
    readonly c: number;
    readonly d: number;
    readonly e: number;
    readonly f: number;
    readonly g: number;
    readonly h: number;
  }

  const o = {
    a: 1,
    b: 2,
    c: 3,
    d: 4,
    e: 5,
    f: 6,
    g: 7,
    h: 8,
  };

  expect(
    Decode.map8(
      (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => {
        return {
          a: a,
          b: b,
          c: c,
          d: d,
          e: e,
          f: f,
          g: g,
          h: h,
        } as My;
      },
      field('a', num),
      field('b', num),
      field('c', num),
      field('d', num),
      field('e', num),
      field('f', num),
      field('g', num),
      field('h', num),
    ).decodeValue(o),
  ).toEqual(ok(o));
});

describe('mapObject', () => {
  type MyType = {
    foo: string;
    bar: number;
  };
  const expected: MyType = {
    foo: 'a foo',
    bar: 13,
  };

  test('simple', () => {
    const value = { foo: 'a foo', bar: 13 };
    expect(
      Decode.mapObject<MyType>({
        foo: Decode.field('foo', Decode.str),
        bar: Decode.field('bar', Decode.num),
      }).decodeValue(value),
    ).toEqual(ok(expected));
  });

  test('simpler', () => {
    const value = { foo: 'a foo', bar: 13 };
    expect(
      Decode.mapObject<MyType>(
        Decode.mapRequiredFields({
          foo: Decode.str,
          bar: Decode.num,
        }),
      ).decodeValue(value),
    ).toEqual(ok(expected));
  });

  test('missing field', () => {
    const value = { foo: 'a foo' };
    expect(
      Decode.mapObject<MyType>({
        foo: Decode.field('foo', Decode.str),
        bar: Decode.field('bar', Decode.num),
      }).decodeValue(value),
    ).toEqual(err('path not found [bar] on {"foo":"a foo"}'));
  });

  test('superfluous field', () => {
    const value = { foo: 'a foo', bar: 13, toto: true };
    expect(
      Decode.mapObject<MyType>({
        foo: Decode.field('foo', Decode.str),
        bar: Decode.field('bar', Decode.num),
      }).decodeValue(value),
    ).toEqual(ok(expected));
  });

  test('optional field', () => {
    type MyType2 = {
      foo: string;
      bar?: number;
    };
    const expected: MyType2 = {
      foo: 'a foo',
    };

    const value = { foo: 'a foo', toto: true };
    expect(
      Decode.mapObject<MyType2>({
        foo: Decode.field('foo', Decode.str),
        bar: Decode.optionalField('bar', Decode.num),
      }).decodeValue(value),
    ).toEqual(ok(expected));

    // the type system will compile fail this test:
    // expect(Decode.mapObject<MyType2>({
    //   foo: Decode.field('foo', Decode.str),
    // }).decodeValue(value)).toEqual(ok(expected));
  });

  test('simpler optional field', () => {
    type MyType2 = {
      foo: string;
      bar?: number;
    };
    const expected: MyType2 = {
      foo: 'a foo',
    };

    const decoder: DecoderObject<MyType2> = {
      ...Decode.mapRequiredFields({
        foo: Decode.str,
      }),
      ...Decode.mapOptionalFields({
        bar: Decode.num,
      }),
    };

    const value = { foo: 'a foo', toto: true };
    expect(Decode.mapObject<MyType2>(decoder).decodeValue(value)).toEqual(ok(expected));
  });

  test('decode array of mapObject', () => {
    type MyItem = { gnu: number; foo: string };

    const MyItemDecoder: Decoder<MyItem> = Decode.mapObject(
      Decode.mapRequiredFields({
        gnu: Decode.num,
        foo: Decode.str,
      }),
    );

    const payload: MyItem[] = [
      {
        gnu: 1,
        foo: 'a',
      },
      {
        gnu: 2,
        foo: 'b',
      },
    ];

    const r = Decode.array(MyItemDecoder).decodeValue(payload);
    expect(r).toEqual(ok(payload));
  });
});

describe('mapArray', () => {
  type MyType = [string, number];
  const expected: MyType = ['a foo', 13];

  test('simple', () => {
    type ValueType = [string, number];
    const value: ValueType = ['a foo', 13];
    expect(
      Decode.mapTuple<ValueType>([Decode.str, Decode.num]).decodeValue(value),
    ).toEqual(ok(expected));
  });

  test('type mismatch', () => {
    type ValueType = [string, number];
    const value: ValueType = ['a foo', 13];

    // the type system will compile fail this test:
    // expect(Decode.mapArray<ValueType>([
    //   Decode.str,
    //   Decode.str
    // ]).decodeValue(value)).toEqual(err('ran into decoder error at [1] : value is not a string : 13'));

    // the type system will let though to runtime:
    expect(Decode.mapTuple([Decode.str, Decode.str]).decodeValue(value)).toEqual(
      err('ran into decoder error at [1] : value is not a string : 13'),
    );
  });

  test('missing item', () => {
    type ValueType = [string, number];
    // the type system will compile fail this test:
    // const value: ValueType  = ['a foo']

    // the type system will let though to runtime:
    const value = ['a foo'];
    expect(Decode.mapTuple([Decode.str, Decode.num]).decodeValue(value)).toEqual(
      err('path not found [1] on ["a foo"]'),
    );
  });

  test('too many items', () => {
    type ValueType = [string, number];
    // the type system will compile fail this test:
    // const value: ValueType = ['a foo', 13, true]

    // the type system will let though to runtime:
    const value = ['a foo', 13, true];
    expect(Decode.mapTuple([Decode.str, Decode.num]).decodeValue(value)).toEqual(ok(expected));
  });
});

test('andThen', () => {
  type Stuff = { readonly tag: 'stuff1'; readonly foo: string } | { readonly tag: 'stuff2'; readonly bar: string };

  const stuff: Decoder<Stuff> = Decode.andThen(stuffHelp, field('tag', Decode.str));

  function stuffHelp(tag: string): Decoder<Stuff> {
    switch (tag) {
      case 'stuff1':
        return stuff1Decoder;
      case 'stuff2':
        return stuff2Decoder;
      default:
        return Decode.fail('unknown stuff ' + tag);
    }
  }

  const stuff1Decoder: Decoder<Stuff> = Decode.map((foo: string) => {
    return {
      tag: 'stuff1',
      foo: foo,
    } as Stuff;
  }, Decode.field('foo', Decode.str));

  const stuff2Decoder: Decoder<Stuff> = Decode.map((bar: string) => {
    return {
      tag: 'stuff2',
      bar: bar,
    } as Stuff;
  }, Decode.field('bar', Decode.str));

  const s1: any = {
    tag: 'stuff1',
    foo: 'bar',
  };

  const s2: any = {
    tag: 'stuff2',
    bar: 'baz',
  };

  expect(stuff.decodeValue(s1)).toEqual(ok(s1));

  expect(stuff.decodeValue(s2)).toEqual(ok(s2));

  expect(
    stuff.decodeValue({
      tag: 'wtf',
      blah: 'blah',
    }),
  ).toEqual(err('unknown stuff wtf'));

  expect(
    stuff.decodeValue({
      tag: 'stuff1',
      notThere: true,
    }),
  ).toEqual(err('path not found [foo] on {"tag":"stuff1","notThere":true}'));
});

test('lazy', () => {
  interface Comment {
    readonly message: string;
    readonly responses: ReadonlyArray<Comment>;
  }

  const comment: Decoder<Comment> = Decode.map2(
    (message: string, responses: Comment[]) => {
      return {
        message: message,
        responses: responses,
      } as Comment;
    },
    field('message', Decode.str),
    field('responses', Decode.array(Decode.lazy(() => comment))),
  );

  const v = {
    message: 'hello',
    responses: [
      {
        message: 'there',
        responses: [],
      },
      {
        message: 'world',
        responses: [],
      },
    ],
  };

  expect(comment.decodeValue(v)).toEqual(ok(v));
});

test('oneOf', () => {
  const badInt: Decoder<number> = Decode.oneOf([Decode.num, Decode.null(0)]);

  expect(badInt.decodeValue(123)).toEqual(ok(123));
  expect(badInt.decodeValue(null)).toEqual(ok(0));
  expect(badInt.decodeValue('foo')).toEqual(err('ran out of decoders for "foo"'));
});

test('from string', () => {
  expect(num.decodeString('123')).toEqual(ok(123));
});

test('any value', () => {
  const anyValue = { foo: 'bar' };
  expect(Decode.value.decodeValue(anyValue)).toEqual(ok(anyValue));
});

describe('optional field', () => {
  test('is present', () => {
    const value = { foo: 'bar', gnu: 13 };
    expect(Decode.optionalField('gnu', Decode.num).decodeValue(value)).toEqual(ok(13));
  });
  test('is missing', () => {
    const value = { foo: 'bar' };
    expect(Decode.optionalField('gnu', Decode.num).decodeValue(value)).toEqual(ok(undefined));
  });

  test('typical use case', () => {
    type MyType = {
      foo: string;
      gnu?: number;
    };
    const value = { foo: 'bar' };
    const expected: MyType = {
      foo: 'bar',
    };
    expect(
      Decode.map2(
        (foo, gnu) => {
          return { foo, gnu };
        },
        Decode.field('foo', Decode.str),
        Decode.optionalField('gnu', Decode.num),
      ).decodeValue(value),
    ).toEqual(ok(expected));
  });

  test('simpler optional field', () => {
    type MyType2 = {
      foo: string;
      bar?: number;
    };
    const expected: MyType2 = {
      foo: 'a foo',
    };

    const value = { foo: 'a foo', toto: true };
    expect(
      Decode.mapObject<MyType2>({
        ...Decode.mapRequiredFields({
          foo: Decode.str,
        }),
        bar: Decode.optionalField('bar', Decode.num),
      }).decodeValue(value),
    ).toEqual(ok(expected));
  });
});

describe('null types', () => {
  test('non null value', () => {
    const value = { foo: 'bar' };
    const result: Result<string, string | null> = Decode.orNull(Decode.field('foo', Decode.str)).decodeValue(value);
    expect(result).toEqual(ok('bar'));
  });

  test('null value', () => {
    const value = { foo: null };
    const result: Result<string, string | null> = Decode.field('foo', Decode.orNull(Decode.str)).decodeValue(value);
    expect(result).toEqual(ok(null));
  });

  test('typical use case', () => {
    type MyType = {
      gnu: number | null;
      foo: string | null;
    };
    const value = { foo: null, gnu: null };
    const expected: MyType = {
      foo: null,
      gnu: null,
    };
    expect(
      Decode.map2(
        (foo, gnu) => {
          return { foo, gnu };
        },
        Decode.field('foo', Decode.orNull(Decode.str)),
        Decode.field('gnu', Decode.orNull(Decode.num)),
      ).decodeValue(value),
    ).toEqual(ok(expected));
  });
});
