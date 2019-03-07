import {Router, int, route0, route1, route2, route3, RouteDef, str} from "./Navigation";
import {just, nothing} from "./Maybe";

type MyRoute
    = { type: "home" }
    | { type: "songs" }
    | { type: "song", id: number, edit: boolean }


function home(): MyRoute {
    return { type: "home" }
}

function songs(): MyRoute {
    return { type: "songs" }
}

function song(id:number, edit:boolean = false): MyRoute {
    return {
        type: "song",
        id: id,
        edit: edit
    }
}

const router: Router<MyRoute> = new Router([
    route0(home),
    route1(str("songs"), songs),
    route2(str("song"), int(), (_, id) => song(id)),
    route3(str("song"), int(), str("edit"), (s, id) => song(id, true))
]);



expectRoute("/", home());
expectRoute("/songs", songs());
expectRoute("/song/123", song(123));
expectRoute("/song/123/edit", song(123, true));
expectNotFound("/foo");
expectNotFound("/songs/1");
expectNotFound("/song");
expectNotFound("/song/abc");
expectNotFound("/song/123/foo");


function expectRoute(path:string, route: MyRoute) {
    return test(path, () => {
        expect(router.parsePath(path)).toEqual(just(route));
    })
}

function expectNotFound(path:string) {
    return test(path, () => {
        expect(router.parsePath(path)).toEqual(nothing);
    })
}


