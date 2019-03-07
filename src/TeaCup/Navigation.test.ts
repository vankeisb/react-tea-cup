import {Router, int, route0, route1, route2, route3, str} from "./Navigation";
import {just, Maybe, nothing} from "./Maybe";

type MyRoute
    = { type: "home" }
    | { type: "songs" }
    | { type: "song", id: number, edit: boolean }
    | { type: "settings",  q: string }


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

function settings(q:string): MyRoute {
    return {
        type: "settings",
        q: q
    }
}

const router: Router<MyRoute> = new Router([
    route1(str("songs")).map(songs),
    route0().map(home),
    route3(str("song"), int(), str("edit")).map((s, id) => song(id, true)),
    route2(str("song"), int()).map((_, id) => song(id)),
    // route1(str("settings")).map(_ => settings(""))
]);



expectRoute("/", home());
expectRoute("/songs", songs());
expectRoute("/song/123", song(123));
expectRoute("/song/123/edit", song(123, true));
// expectRoute("/settings", settings(""));
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


