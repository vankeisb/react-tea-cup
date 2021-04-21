export type F<T,R> = (t:T) => R;

interface Data<T,R> {
  readonly arg: T;
  readonly res: R;
}

export function memoize<T,R>(f: F<T,R>, compareFn?: (o1: T, o2: T) => boolean): F<T,R> {
  let data: Data<T,R> | undefined;

  function invoke(t:T): R {
    const res = f(t);
    data = {
      arg: t,
      res,
    }
    return res;
  }

  const compare = compareFn ?? ((o1, o2) => o1 === o2);

  return (t:T) => {
    if (data) {
      if (compare(t, data.arg)) {
        return data.res;
      } else {
        return invoke(t);
      }
    } else {
      return invoke(t);
    }
  }
}
