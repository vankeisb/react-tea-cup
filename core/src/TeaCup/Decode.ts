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

import { err, ok, Result } from './Result';
import { just, Maybe, nothing } from './Maybe';
import { List } from './List';

/**
 * Decoder for a given type.
 */
export class Decoder<T> {
  private readonly f: (o: any) => Result<string, T>;

  constructor(f: (o: any) => Result<string, T>) {
    this.f = f;
  }

  /**
   * Attempt to decode passed JSON string into a T
   * @param s the string to decode
   */
  decodeString(s: string): Result<string, T> {
    try {
      const o = JSON.parse(s);
      return this.decodeValue(o);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown JSON error';
      return err(msg);
    }
  }

  /**
   * Attempt to decode a JS value into a T
   * @param o the value to decode
   */
  decodeValue(o: any): Result<string, T> {
    return this.f(o);
  }
}

function stringifyForMsg(o: any, maxChars: number = 100): string {
  if (o === null) {
    return 'null';
  }
  if (o === undefined) {
    return 'undefined';
  }
  try {
    const s = JSON.stringify(o);
    if (s.length > maxChars) {
      return s.substring(0, maxChars - 1);
    } else {
      return s;
    }
  } catch (e) {
    return o.toString();
  }
}

/**
 * Decoding primitives and utilities.
 */
export class Decode {
  // Primitives

  /**
   * string decoder
   */
  static str: Decoder<string> = new Decoder<string>((o: any) => {
    if (o !== null && o !== undefined && typeof o === 'string') {
      return ok(o);
    } else {
      return err(`value is not a string : ${stringifyForMsg(o)}`);
    }
  });

  /**
   * boolean decoder
   */
  static bool: Decoder<boolean> = new Decoder<boolean>((o: any) => {
    if (o !== null && o !== undefined && typeof o === 'boolean') {
      return ok(o);
    } else {
      return err(`value is not a boolean : ${stringifyForMsg(o)}`);
    }
  });

  /**
   * number decoder
   */
  static num: Decoder<number> = new Decoder<number>((o: any) => {
    if (o !== null && o !== undefined && typeof o === 'number') {
      return ok(o);
    } else {
      return err(`value is not a number : ${stringifyForMsg(o)}`);
    }
  });

  // Data Structures

  /**
   * Decoder for null/undefined values
   * @param d the decoder to be used if the value is not null or undefined
   */
  static nullable<T>(d: Decoder<T>): Decoder<Maybe<T>> {
    return new Decoder<Maybe<T>>((o: any) => {
      if (o === null || o === undefined) {
        return ok(nothing);
      } else {
        return d.decodeValue(o).map(just);
      }
    });
  }

  /**
   * Decoder for nullable types
   * @param d the decoder to be used if the value is not null
   */
  static orNull<T>(d: Decoder<T>): Decoder<T | null> {
    return this.map((v) => v.map<T | null>((v) => v).withDefault(null), this.nullable(d));
  }

  /**
   * Decoder for lists
   * @param d the decoder for elements in the list
   */
  static list<T>(d: Decoder<T>): Decoder<List<T>> {
    return Decode.map((a: Array<T>) => List.fromArray(a), Decode.array(d));
  }

  /**
   * Decoder for arrays
   * @param d the decoder for elements in the array
   */
  static array<T>(d: Decoder<T>): Decoder<Array<T>> {
    return new Decoder<Array<T>>((o: any) => {
      if (o instanceof Array) {
        const a: Array<any> = o as Array<any>;
        const res: Array<T> = [];
        for (let i = 0; i < a.length; i++) {
          const r: Result<string, T> = d.decodeValue(a[i]);
          switch (r.tag) {
            case 'Ok':
              res.push(r.value);
              break;
            case 'Err':
              return err(`could not convert element at index ${i} of ${stringifyForMsg(o)} : ${r.err}`);
          }
        }
        return ok(res);
      } else {
        return err(`value is not an array : ${stringifyForMsg(o)}`);
      }
    });
  }

  // Object Primitives

  /**
   * Decoder for object fields
   * @param key the name of the field
   * @param d the decoder for the field's value
   */
  static field<T>(key: string, d: Decoder<T>): Decoder<T> {
    return Decode.at([key], d);
  }

  /**
   * Decoder for optinal object fields
   * @param key the name of the optinal field
   * @param d the decoder for the field's value
   */
  static optionalField<T>(key: string, d: Decoder<T>): Decoder<T | undefined> {
    return Decode.andThen(
      (value) =>
        value
          .map<Decoder<T | undefined>>(
            (v) => new Decoder<T>(() => d.decodeValue(v)),
          )
          .withDefault(Decode.succeed(undefined)),
      Decode.maybe(Decode.field(key, Decode.value)),
    );
  }

  /**
   * Decoder for navigable object properties
   * @param keys a list of fields to navigate
   * @param d the decoder for the leaf value
   */
  static at<T>(keys: ReadonlyArray<string>, d: Decoder<T>): Decoder<T> {
    function isUndef(x: any) {
      return x === null || x === undefined;
    }

    return new Decoder<T>((o: any) => {
      let v: any = o;
      const path: string[] = [];

      function pathToStr() {
        return `[${path.join(',')}]`;
      }

      for (let i = 0; i < keys.length; i++) {
        if (isUndef(v)) {
          return err(`path not found ${pathToStr()} on ${stringifyForMsg(o)}`);
        }
        const key = keys[i];
        path.push(key);
        if (v.hasOwnProperty(key)) {
          v = v[key];
        } else {
          return err(`path not found ${pathToStr()} on ${stringifyForMsg(o)}`);
        }
      }

      const r = d.decodeValue(v);
      switch (r.tag) {
        case 'Ok':
          return r;
        case 'Err':
          return err(`ran into decoder error at ${pathToStr()} : ${r.err}`);
      }
    });
  }

  // Inconsistent Structure

  /**
   * Decoder for optional values : turns decoding failures into maybes.
   * @param d the decoder to be used
   */
  static maybe<T>(d: Decoder<T>): Decoder<Maybe<T>> {
    return new Decoder<Maybe<T>>((o: any) => {
      const v: Result<string, T> = d.decodeValue(o);
      switch (v.tag) {
        case 'Ok':
          return ok(just(v.value));
        case 'Err':
          return ok(nothing);
      }
    });
  }

  /**
   * Tries passed decoders sequentially, and fails if no decoder succeeds
   * @param ds an array of Decoders to try, one after the othen
   */
  static oneOf<T>(ds: ReadonlyArray<Decoder<T>>): Decoder<T> {
    return new Decoder<T>((o: any) => {
      for (let i = 0; i < ds.length; i++) {
        const r: Result<string, T> = ds[i].decodeValue(o);
        switch (r.tag) {
          case 'Ok':
            return r;
          case 'Err':
            break;
        }
      }
      return err(`ran out of decoders for ${stringifyForMsg(o)}`);
    });
  }

  // Mapping

  /**
   * Map a decoder
   * @param f the mapping function
   * @param d the decoder to use
   */
  static map<T1, T2>(f: (t1: T1) => T2, d: Decoder<T1>): Decoder<T2> {
    return new Decoder<T2>((o: any) => {
      return d.decodeValue(o).map(f);
    });
  }

  static map2<T1, T2, T3>(f: (t1: T1, t2: T2) => T3, d1: Decoder<T1>, d2: Decoder<T2>): Decoder<T3> {
    return Decode.andThen(
      (t1: T1) =>
        Decode.andThen((t2: T2) => {
          const t3: T3 = f(t1, t2);
          return Decode.succeed(t3);
        }, d2),
      d1,
    );
  }

  static map3<T1, T2, T3, T4>(
    f: (t1: T1, t2: T2, t3: T3) => T4,
    d1: Decoder<T1>,
    d2: Decoder<T2>,
    d3: Decoder<T3>,
  ): Decoder<T4> {
    return Decode.andThen(
      (t1: T1) =>
        Decode.map2(
          (t2: T2, t3: T3) => {
            return f(t1, t2, t3);
          },
          d2,
          d3,
        ),
      d1,
    );
  }

  static map4<T1, T2, T3, T4, T5>(
    f: (t1: T1, t2: T2, t3: T3, t4: T4) => T5,
    d1: Decoder<T1>,
    d2: Decoder<T2>,
    d3: Decoder<T3>,
    d4: Decoder<T4>,
  ): Decoder<T5> {
    return Decode.andThen(
      (t1: T1) =>
        Decode.map3(
          (t2: T2, t3: T3, t4: T4) => {
            return f(t1, t2, t3, t4);
          },
          d2,
          d3,
          d4,
        ),
      d1,
    );
  }

  static map5<T1, T2, T3, T4, T5, T6>(
    f: (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5) => T6,
    d1: Decoder<T1>,
    d2: Decoder<T2>,
    d3: Decoder<T3>,
    d4: Decoder<T4>,
    d5: Decoder<T5>,
  ): Decoder<T6> {
    return Decode.andThen(
      (t1: T1) =>
        Decode.map4(
          (t2: T2, t3: T3, t4: T4, t5: T5) => {
            return f(t1, t2, t3, t4, t5);
          },
          d2,
          d3,
          d4,
          d5,
        ),
      d1,
    );
  }

  static map6<T1, T2, T3, T4, T5, T6, T7>(
    f: (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6) => T7,
    d1: Decoder<T1>,
    d2: Decoder<T2>,
    d3: Decoder<T3>,
    d4: Decoder<T4>,
    d5: Decoder<T5>,
    d6: Decoder<T6>,
  ): Decoder<T7> {
    return Decode.andThen(
      (t1: T1) =>
        Decode.map5(
          (t2: T2, t3: T3, t4: T4, t5: T5, t6: T6) => {
            return f(t1, t2, t3, t4, t5, t6);
          },
          d2,
          d3,
          d4,
          d5,
          d6,
        ),
      d1,
    );
  }

  static map7<T1, T2, T3, T4, T5, T6, T7, T8>(
    f: (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6, t7: T7) => T8,
    d1: Decoder<T1>,
    d2: Decoder<T2>,
    d3: Decoder<T3>,
    d4: Decoder<T4>,
    d5: Decoder<T5>,
    d6: Decoder<T6>,
    d7: Decoder<T7>,
  ): Decoder<T8> {
    return Decode.andThen(
      (t1: T1) =>
        Decode.map6(
          (t2: T2, t3: T3, t4: T4, t5: T5, t6: T6, t7: T7) => {
            return f(t1, t2, t3, t4, t5, t6, t7);
          },
          d2,
          d3,
          d4,
          d5,
          d6,
          d7,
        ),
      d1,
    );
  }

  static map8<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
    f: (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6, t7: T7, t8: T8) => T9,
    d1: Decoder<T1>,
    d2: Decoder<T2>,
    d3: Decoder<T3>,
    d4: Decoder<T4>,
    d5: Decoder<T5>,
    d6: Decoder<T6>,
    d7: Decoder<T7>,
    d8: Decoder<T8>,
  ): Decoder<T9> {
    return Decode.andThen(
      (t1: T1) =>
        Decode.map7(
          (t2: T2, t3: T3, t4: T4, t5: T5, t6: T6, t7: T7, t8: T8) => {
            return f(t1, t2, t3, t4, t5, t6, t7, t8);
          },
          d2,
          d3,
          d4,
          d5,
          d6,
          d7,
          d8,
        ),
      d1,
    );
  }

  /**
   * Decoder for big objects, where map8() is not enough.
   * @param dobject an object with decoders
   */
  static mapObject<T>(dobject: DecoderObject<T>): Decoder<T> {
    const keys = Object.keys(dobject) as Array<keyof typeof dobject>;
    return new Decoder((value: any) =>
      keys.reduce((acc, key) => {
        const propertyDecoder = getProperty(dobject, key);
        const v = propertyDecoder.decodeValue(value);
        return v.andThen((v) =>
          acc.map((acc) => {
            acc[key] = v;
            return acc;
          }),
        );
      }, ok<string, T>({} as T)),
    );
  }

  /**
   * Convenience, map decoder object to another decoder object
   * @param decoders an object with decoders
   * @param fun the mapper function
   */
  static mapFields<T, T2>(decoders: DecoderObject<T>, fun: DecoderObjectMapper<T, T2>): DecoderObject<T2> {
    const keys = Object.keys(decoders) as Array<keyof typeof decoders>;
    const partial: Partial<DecoderObject<T2>> = keys.reduce((acc, key) => {
      const propertyDecoder = getProperty(decoders, key);
      const [key2, propertyDecoder2] = fun(key, propertyDecoder);
      acc[key2] = propertyDecoder2;
      return acc;
    }, {} as Partial<DecoderObject<T2>>);
    return partial as DecoderObject<T2>;
  }

  /**
   * Convenience, map docoders to required field decoders
   * @param decoders an object with decoders
   */
  static mapRequiredFields<T>(decoders: DecoderObject<T>): DecoderObject<T> {
    return this.mapFields(decoders, (k: keyof T, d: Decoder<T[keyof T]>) => [k, Decode.field(k as string, d)]);
  }

  /**
   * Convenience, map decoders to optional field decoders
   * @param decoders an object with decoders
   */
  static mapOptionalFields<T>(decoders: DecoderObject<T>): DecoderObject<OptionalFields<T>> {
    const mapper: DecoderObjectMapper<T, OptionalFields<T>> = (k: keyof T, d: Decoder<T[keyof T]>) => [
      k,
      Decode.optionalField(k as string, d),
    ];
    return this.mapFields(decoders, mapper);
  }

  /**
   * Decoder for fixed-length tuples.
   * @param decoders an array with decoders
   */
  static mapTuple<T extends any[]>(decoders: DecoderArray<T>): Decoder<T> {
    return Decode.map((v) => Object.values(v) as T, this.mapObject<T>(this.mapRequiredFields<T>(decoders)));
  }

  // Fancy Decoding

  /**
   * Decoder for recursive data structures
   * @param f a no-arg function that yields a decoder
   */
  static lazy<T>(f: () => Decoder<T>): Decoder<T> {
    return new Decoder<T>((o: any) => {
      return f().decodeValue(o);
    });
  }

  /**
   * Decoder for any value
   */
  static value: Decoder<any> = new Decoder<any>((o) => ok(o));

  /**
   * Decoder for null
   * @param t the result to yield in case the decoded value is null
   */
  static null<T>(t: T): Decoder<T> {
    return new Decoder<T>((o: any) => {
      if (o === null) {
        return ok(t);
      } else {
        return err(`expected null for ${stringifyForMsg(o)}`);
      }
    });
  }

  /**
   * Decoder that always succeed
   * @param t the value to yield
   */
  static succeed<T>(t: T): Decoder<T> {
    return new Decoder<T>(() => {
      return ok(t);
    });
  }

  /**
   * Decoder that fails
   * @param msg the message to use in the resulting Err
   */
  static fail<T>(msg: string): Decoder<T> {
    return new Decoder<T>(() => {
      return err(msg);
    });
  }

  /**
   * Chain decoders
   * @param f the function to apply if the first decoder has succeeded
   * @param d the first decoder to use
   */
  static andThen<T1, T2>(f: (t1: T1) => Decoder<T2>, d: Decoder<T1>): Decoder<T2> {
    return new Decoder<T2>((o: any) => {
      const r: Result<string, T1> = d.decodeValue(o);
      switch (r.tag) {
        case 'Ok':
          const t1: T1 = r.value;
          const d2: Decoder<T2> = f(t1);
          return d2.decodeValue(o);
        case 'Err':
          return err(r.err);
      }
    });
  }
}

function getProperty<T, K extends keyof T>(o: T, key: K): T[K] {
  return o[key];
}

export type DecoderObject<T> = Required<{ [P in keyof T]: Decoder<T[P]> }>;
export type DecoderArray<A extends any[]> = Required<
  { [P in keyof A]: A[P] extends A[number] ? Decoder<A[P]> : never }
>;

export type OptionalFields<T> = {
  [P in keyof T]: T[P] | undefined;
};

export type DecoderObjectMapper<T, T2> = (k: keyof T, d: Decoder<T[keyof T]>) => [keyof T2, Decoder<T2[keyof T2]>];
