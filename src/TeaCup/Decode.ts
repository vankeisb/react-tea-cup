import {err, ok, Result} from "./Result";
import {just, Maybe, nothing} from "./Maybe";
import {List} from "./List";


export class Decoder<T> {

    private readonly f: (o:any) => Result<string,T>;

    constructor(f: (o: any) => Result<string, T>) {
        this.f = f;
    }

    decodeString(s:string): Result<string,T> {
        try {
            const o = JSON.parse(s);
            return this.decodeValue(o);
        } catch (e) {
            return err(e)
        }
    }

    decodeValue(o:any): Result<string,T> {
        return this.f(o);
    }

}


function stringifyForMsg(o:any, maxChars: number = 100): string {
    if (o === null) {
        return "null";
    }
    if (o === undefined) {
        return "undefined";
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


export class Decode {

    // Primitives

    static str: Decoder<string> = new Decoder<string>((o:any) => {
        if (o !== null && o !== undefined && typeof o === "string") {
            return ok(o);
        } else {
            return err(`value is not a string : ${stringifyForMsg(o)}`)
        }
    });

    static bool: Decoder<boolean> = new Decoder<boolean>((o:any) => {
        if (o !== null && o !== undefined && typeof o === "boolean") {
            return ok(o);
        } else {
            return err(`value is not a boolean : ${stringifyForMsg(o)}`)
        }
    });

    static num: Decoder<number> = new Decoder<number>((o:any) => {
        if (o !== null && o !== undefined && typeof o === "number") {
            return ok(o);
        } else {
            return err(`value is not a number : ${stringifyForMsg(o)}`)
        }
    });


    // Data Structures

    static nullable<T>(d:Decoder<T>): Decoder<Maybe<T>> {
        return new Decoder<Maybe<T>>((o:any) => {
            if (o === null || o === undefined) {
                return ok(nothing);
            } else {
                return d.decodeValue(o).map(just);
            }
        })
    }

    static list<T>(d:Decoder<T>): Decoder<List<T>> {
        return Decode.map(
            (a:Array<T>) => List.fromArray(a),
            Decode.array(d)
        )
    }


    static array<T>(d:Decoder<T>): Decoder<Array<T>> {
        return new Decoder<Array<T>>((o:any) => {
            if (o instanceof Array) {
                const a: Array<any> = o as Array<any>;
                const res: Array<T> = [];
                for (let i=0 ; i<a.length ; i++) {
                    const r: Result<string,T> = d.decodeValue(a[i]);
                    switch (r.tag) {
                        case "Ok":
                            res.push(r.value);
                            break;
                        case "Err":
                            return err(`could not convert element at index ${i} of ${stringifyForMsg(o)} : ${r.err}`)
                    }
                }
                return ok(res);
            } else {
                return err(`value is not an array : ${stringifyForMsg(o)}`);
            }
        })
    }


    // Object Primitives

    static field<T>(key:string, d:Decoder<T>): Decoder<T> {
        return Decode.at([key], d)
    }

    static at<T>(keys: ReadonlyArray<string>, d:Decoder<T>): Decoder<T> {

        function isUndef(x:any) {
            return x === null || x === undefined
        }


        return new Decoder<T>((o:any) => {

            let v:any = o;
            const path: string[] = [];

            function pathToStr() {
                return `[${path.join(",")}]`
            }

            for (let i=0 ; i<keys.length ; i++) {
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
                case "Ok":
                    return r;
                case "Err":
                    return err(`ran into decoder error at ${pathToStr()} : ${r.err}`);
            }
        })
    }


    // Inconsistent Structure

    static maybe<T>(d:Decoder<T>): Decoder<Maybe<T>> {
        return new Decoder<Maybe<T>>((o:any) => {
            const v:Result<string,T> = d.decodeValue(o);
            switch (v.tag) {
                case "Ok":
                    return ok(just(v.value));
                case "Err":
                    return ok(nothing);
            }
        })
    }


    static oneOf<T>(ds:ReadonlyArray<Decoder<T>>): Decoder<T> {
        return new Decoder<T>((o:any) => {
            for (let i=0; i<ds.length; i++) {
                const r:Result<string,T> = ds[i].decodeValue(o);
                switch (r.tag) {
                    case "Ok":
                        return r;
                    case "Err":
                        break;
                }
            }
            return err(`ran out of decoders for ${stringifyForMsg(o)}`)
        })
    }


    // Mapping

    static map<T1,T2>(f:(t1:T1) => T2, d:Decoder<T1>): Decoder<T2> {
        return new Decoder<T2>((o:any) => {
            return d.decodeValue(o).map(f);
        })
    }

    static map2<T1,T2,T3>(f:(t1:T1, t2:T2) => T3, d1:Decoder<T1>, d2:Decoder<T2>): Decoder<T3> {
        return Decode.andThen(
            (t1:T1) =>
                Decode.andThen(
                    (t2:T2) => {
                        const t3:T3 = f(t1, t2);
                        return Decode.succeed(t3)
                    },
                    d2
                )
            ,
            d1
        );
    }

    static map3<T1,T2,T3,T4>(f:(t1:T1, t2:T2, t3:T3) => T4, d1:Decoder<T1>, d2:Decoder<T2>, d3:Decoder<T3>): Decoder<T4> {
        return Decode.andThen(
            (t1:T1) => Decode.map2((t2:T2,t3:T3) => {
                return f(t1,t2,t3)
            }, d2, d3),
            d1
        );
    }

    static map4<T1,T2,T3,T4,T5>(f:(t1:T1, t2:T2, t3:T3, t4:T4) => T5, d1:Decoder<T1>, d2:Decoder<T2>, d3:Decoder<T3>, d4:Decoder<T4>): Decoder<T5> {
        return Decode.andThen(
            (t1:T1) => Decode.map3((t2:T2,t3:T3, t4:T4) => {
                return f(t1,t2,t3,t4)
            }, d2, d3, d4),
            d1
        );
    }

    static map5<T1,T2,T3,T4,T5,T6>(f:(t1:T1, t2:T2, t3:T3, t4:T4, t5: T5) => T6, d1:Decoder<T1>, d2:Decoder<T2>, d3:Decoder<T3>, d4:Decoder<T4>, d5:Decoder<T5>): Decoder<T6> {
        return Decode.andThen(
            (t1:T1) => Decode.map4((t2:T2,t3:T3,t4:T4,t5:T5) => {
                return f(t1,t2,t3,t4,t5)
            }, d2, d3, d4, d5),
            d1
        );
    }

    static map6<T1,T2,T3,T4,T5,T6,T7>(f:(t1:T1, t2:T2, t3:T3, t4:T4, t5: T5, t6: T6) => T7, d1:Decoder<T1>, d2:Decoder<T2>, d3:Decoder<T3>, d4:Decoder<T4>, d5:Decoder<T5>, d6:Decoder<T6>): Decoder<T7> {
        return Decode.andThen(
            (t1:T1) => Decode.map5((t2:T2,t3:T3,t4:T4,t5:T5,t6:T6) => {
                return f(t1,t2,t3,t4,t5,t6)
            }, d2, d3, d4, d5, d6),
            d1
        );
    }

    static map7<T1,T2,T3,T4,T5,T6,T7,T8>(f:(t1:T1, t2:T2, t3:T3, t4:T4, t5: T5, t6: T6, t7:T7) => T8, d1:Decoder<T1>, d2:Decoder<T2>, d3:Decoder<T3>, d4:Decoder<T4>, d5:Decoder<T5>, d6:Decoder<T6>, d7:Decoder<T7>): Decoder<T8> {
        return Decode.andThen(
            (t1:T1) => Decode.map6((t2:T2,t3:T3,t4:T4,t5:T5,t6:T6,t7:T7) => {
                return f(t1,t2,t3,t4,t5,t6,t7)
            }, d2, d3, d4, d5, d6, d7),
            d1
        );
    }

    static map8<T1,T2,T3,T4,T5,T6,T7,T8,T9>(f:(t1:T1, t2:T2, t3:T3, t4:T4, t5: T5, t6: T6, t7:T7, t8:T8) => T9, d1:Decoder<T1>, d2:Decoder<T2>, d3:Decoder<T3>, d4:Decoder<T4>, d5:Decoder<T5>, d6:Decoder<T6>, d7:Decoder<T7>, d8:Decoder<T8>): Decoder<T9> {
        return Decode.andThen(
            (t1:T1) => Decode.map7((t2:T2,t3:T3,t4:T4,t5:T5,t6:T6,t7:T7,t8:T8) => {
                return f(t1,t2,t3,t4,t5,t6,t7,t8)
            }, d2, d3, d4, d5, d6, d7, d8),
            d1
        );
    }

    // Fancy Decoding


    static lazy<T>(f:() => Decoder<T>): Decoder<T> {
        return new Decoder<T>((o:any) => {
            return f().decodeValue(o)
        })
    }


    static value: Decoder<any> = new Decoder<any>(o => o);


    static null<T>(t:T): Decoder<T> {
        return new Decoder<T>((o:any) => {
            if (o === null) {
                return ok(t);
            } else {
                return err(`expected null for ${stringifyForMsg(o)}`)
            }
        })
    }


    static succeed<T>(t:T): Decoder<T> {
        return new Decoder<T>(() => {
            return ok(t)
        })
    }


    static fail<T>(msg:string): Decoder<T> {
        return new Decoder<T>(() => {
            return err(msg)
        })
    }


    static andThen<T1,T2>(f:(t1:T1) => Decoder<T2>, d:Decoder<T1>): Decoder<T2> {
        return new Decoder<T2>((o:any) => {
            const r:Result<string,T1> = d.decodeValue(o);
            switch (r.tag) {
                case "Ok":
                    const t1: T1 = r.value;
                    const d2: Decoder<T2> = f(t1);
                    return d2.decodeValue(o);
                case "Err":
                    return err(r.err);
            }
        })
    }

}