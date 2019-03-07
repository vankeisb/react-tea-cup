import {Router, int, route0, route1, route2, route3, str, QueryParams} from "./Navigation";
import {just, Maybe, nothing} from "./Maybe";

type MyRoute
    = { type: "home" }
    | { type: "songs", filter: Maybe<string> }
    | { type: "song", id: number, edit: boolean }


function home(): MyRoute {
    return { type: "home" }
}

function songs(filter: Maybe<string> = nothing): MyRoute {
    return { type: "songs", filter: filter};
}

function song(id:number, edit:boolean = false): MyRoute {
    return {
        type: "song",
        id: id,
        edit: edit
    }
}

const router: Router<MyRoute> = new Router(
    route1(str("songs")).map((s:string, query:QueryParams) => songs(query.getValue("q"))),
    route0.map(() => home()),
    route3(str("song"), int(), str("edit")).map((s, id) => song(id, true)),
    route2(str("song"), int()).map((_, id) => song(id))
);



expectRoute("/", home());
expectRoute("/songs", songs(nothing));
expectRoute("/song/123", song(123));
expectRoute("/song/123/edit", song(123, true));
expectRoute("/songs?q=foobar", songs(just("foobar")));
expectNotFound("/foo");
expectNotFound("/songs/1");
expectNotFound("/song");
expectNotFound("/song/abc");
expectNotFound("/song/123/foo");


interface Loc {
    pathname: string;
    query: QueryParams;
}

function locFromUrl(url:string): Loc {
    const indexOfQuery = url.indexOf("?");
    if (indexOfQuery == -1) {
        return {
            pathname: url,
            query: QueryParams.empty()
        }
    } else {
        return {
            pathname: url.substring(0, indexOfQuery),
            query: QueryParams.fromQueryString(url.substring(indexOfQuery + 1))
        }
    }
}


function expectRoute(url:string, route: MyRoute) {
    return test(url, () => {
        const loc = locFromUrl(url);
        expect(router.parse(loc.pathname, loc.query)).toEqual(just(route));
    })
}

function expectNotFound(url:string) {
    return test(url + " (not found)", () => {
        const loc = locFromUrl(url);
        expect(router.parse(loc.pathname, loc.query)).toEqual(nothing);
    })
}


