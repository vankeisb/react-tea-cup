import {Cmd, Dispatcher} from "./Tea";

export class RandomCmd<M> extends Cmd<M> {

    readonly toMsg: (x:number) => M;

    constructor(toMsg: (x: number) => M) {
        super();
        this.toMsg = toMsg;
    }

    run(dispatch: Dispatcher<M>): void {
        dispatch(this.toMsg(RandomCmd.randomIntFromInterval(0, 100)))
    }

    static randomIntFromInterval(min: number,max: number)  {// min and max included
        return Math.floor(Math.random()*(max-min+1)+min);
    }

}