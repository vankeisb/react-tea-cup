import {Task} from "./Task";
import {err, ok, Result} from "./Result";

export class Http {

    static fetch(request:RequestInfo, init?: RequestInit): Task<Error,Response> {
        return new FetchTask(request, init);
    }

}


class FetchTask extends Task<Error,Response> {

    private readonly request: RequestInfo;
    private readonly init?: RequestInit;

    constructor(request: RequestInfo, init?: RequestInit) {
        super();
        this.request = request;
        this.init = init;
    }

    execute(callback: (r: Result<Error, Response>) => void): void {
        try {
            fetch(this.request, this.init)
                .then((response:Response) => callback(ok(response)))
                .catch((e:Error) => callback(err(e)));
        } catch (e) {
            callback(err(e));
        }
    }
}