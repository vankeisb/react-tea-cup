
/**
 * Either left, or right.
 */
export type Either<A,B> = Left<A,B> | Right<A,B>


export class Left<A,B> {

    readonly tag = "Left";
    readonly value:A;

    constructor(value: A) {
        this.value = value;
    }

    isLeft(): boolean {
        return true;
    }

    isRight(): boolean {
        return !this.isLeft();
    }

    mapLeft<C>(f:(a:A) => C): Either<C,B> {
        return new Left(f(this.value));
    }

    mapRight<C>(f:(b:B) => C): Either<A,C> {
        return new Left(this.value);
    }

    match<R>(onLeft: (a:A) => R, onRight: (b:B) => R): R {
        return onLeft(this.value);
    }

}


export class Right<A,B> {

    readonly tag = "Right";
    readonly value:B;

    constructor(value: B) {
        this.value = value;
    }

    isLeft(): boolean {
        return false;
    }

    isRight(): boolean {
        return !this.isLeft();
    }

    mapLeft<C>(f:(a:A) => C): Either<C,B> {
        return new Right(this.value);
    }

    mapRight<C>(f:(b:B) => C): Either<A,C> {
        return new Right(f(this.value));
    }

    match<R>(onLeft: (a:A) => R, onRight: (b:B) => R): R {
        return onRight(this.value);
    }

}

export function left<A,B>(a:A): Either<A,B> {
    return new Left(a);
}


export function right<A,B>(b:B): Either<A,B> {
    return new Right(b);
}

