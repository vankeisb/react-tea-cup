import {Router, int, route0, route1, route2, route3, str, QueryParams, RouteDef} from "./Navigation";
import {just, Maybe, nothing} from "./Maybe";


type MyRoute
    = { type: "home" }
    | { type: "songs", filter: Maybe<string> }
    | { type: "song", id: number, edit: boolean }
    | { type: "settings", section: Maybe<string> }
    | { type: "with-slashes", rest: Maybe<string> }
    | { type: "with-spaces", v: string }


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


function settings(section: Maybe<string>): MyRoute {
    return {
        type: "settings",
        section: section
    }
}


function withSlashes(rest: Maybe<string>): MyRoute {
    return {
        type: "with-slashes",
        rest: rest
    }
}

function withSpaces(v:string): MyRoute {
    return {
        type: "with-spaces",
        v: v
    }
}


const router: Router<MyRoute> = new Router(
    route1(str("songs")).map((s:string, query:QueryParams) => songs(query.getValue("q"))),
    route0.map(() => home()),
    route3(str("song"), int(), str("edit")).map((s, id) => song(id, true)),
    route2(str("song"), int()).map((_, id) => song(id)),
    route1(str("settings")).map((_:string,query:QueryParams) => settings(query.getHash())),
    route2(str("with-spaces"), str()).map((_,v) => {
        return withSpaces(v);
    }),
    {
        checkRoute(pathname: string, query: QueryParams): Maybe<MyRoute> {
            const parts = RouteDef.splitPath(pathname);
            if (parts.length < 2) {
                return nothing;
            }
            if (parts[0] !== "with" || parts[1] !== "slashes") {
                return nothing;
            }
            const rest = parts.length === 2 ? nothing : just(parts.slice(2).join("/"));
            return just(withSlashes(rest));
        }
    }
);



expectRoute("/", home());
expectRoute("/songs", songs(nothing));
expectRoute("/song/123", song(123));
expectRoute("/song/123/edit", song(123, true));
expectRoute("/songs?q=foobar", songs(just("foobar")));
expectRoute("/settings", settings(nothing));
expectRoute("/settings#blah", settings(just("blah")));
expectRoute("/with/slashes", withSlashes(nothing));
expectRoute("/with/slashes/foo", withSlashes(just("foo")));
expectRoute("/with/slashes/foo/bar", withSlashes(just("foo/bar")));
expectRoute("/with/slashes/foo/bar/baz", withSlashes(just("foo/bar/baz")));
expectRoute("/with-spaces/foo%20bar", withSpaces("foo bar"));
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
    const indexOfQ = url.indexOf("?");
    if (indexOfQ === -1) {
        const indexOfH = url.indexOf("#");
        if (indexOfH === -1) {
            return {
                pathname: url,
                query: QueryParams.empty()
            }
        } else {
            return {
                pathname: url.substring(0, indexOfH),
                query: QueryParams.fromQueryStringAndHash(undefined, url.substring(indexOfH + 1))
            }
        }
    } else {
        const pathname = url.substring(0, indexOfQ);
        const rest = url.substring(indexOfQ + 1);
        const indexOfH = rest.indexOf("#");
        if (indexOfH === -1) {
            return {
                pathname: pathname,
                query: QueryParams.fromQueryStringAndHash(rest)
            }
        } else {
            const q = rest.substring(0, indexOfH);
            const h = rest.substring(indexOfH + 1);
            return {
                pathname: pathname,
                query: QueryParams.fromQueryStringAndHash(q, h)
            }
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


