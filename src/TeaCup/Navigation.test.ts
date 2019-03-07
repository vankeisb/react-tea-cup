import {Router, int, route0, route1, route2, route3, str, QueryParams} from "./Navigation";
import {just, Maybe, nothing} from "./Maybe";


type MyRoute
    = { type: "home" }
    | { type: "songs", filter: Maybe<string> }
    | { type: "song", id: number, edit: boolean }
    | { type: "settings", section: Maybe<string> }


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


const router: Router<MyRoute> = new Router(
    route1(str("songs")).map((s:string, query:QueryParams) => songs(query.getValue("q"))),
    route0.map(() => home()),
    route3(str("song"), int(), str("edit")).map((s, id) => song(id, true)),
    route2(str("song"), int()).map((_, id) => song(id)),
    route1(str("settings")).map((_:string,query:QueryParams) => settings(query.getHash()))
);



expectRoute("/", home());
expectRoute("/songs", songs(nothing));
expectRoute("/song/123", song(123));
expectRoute("/song/123/edit", song(123, true));
expectRoute("/songs?q=foobar", songs(just("foobar")));
expectRoute("/settings", settings(nothing));
expectRoute("/settings#blah", settings(just("blah")));
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


