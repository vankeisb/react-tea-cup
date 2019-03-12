import {err, ok, Result} from "./Result";
import {just, Maybe, nothing} from "./Maybe";


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
        return new Decoder<T>((o:any) => {
            if (o === null || o === undefined) {
                return err(`expected field '${key}' but object is undefined`)
            } else {
                if (typeof o === "object") {
                    if (o.hasOwnProperty(key)) {
                        return d.decodeValue(o[key]);
                    } else {
                        // field not present, that's an err
                        return err(`field "${key}" not found on ${stringifyForMsg(o)}`);
                    }
                } else {
                    return err(`expected field "${key}" but holder is not an object ${stringifyForMsg(o)}`);
                }
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

    // Fancy Decoding


    static lazy<T>(f:() => Decoder<T>): Decoder<T> {
        return new Decoder<T>((o:any) => {
            return f().decodeValue(o)
        })
    }


    static fail<T>(msg:string): Decoder<T> {
        return new Decoder<T>(() => {
            return err(msg)
        })
    }

    static succeed<T>(t:T): Decoder<T> {
        return new Decoder<T>((o:any) => {
            return ok(t)
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