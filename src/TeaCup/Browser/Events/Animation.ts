import {Sub} from "../../Sub";


let subs: Array<RafSub<any>> = [];

let ticking = false;

function tick() {
    // console.log("tick()");
    if (!ticking) {
        ticking = true;
        const subsNow = [...subs];
        // console.log("tick() subsNow=" + subsNow);
        if (subsNow.length > 0) {
            requestAnimationFrame((t: number) => {
                // console.log("tick() trigger subsNow=" + subsNow);
                subsNow.forEach(s => s.trigger(t));
                ticking = false;
                // console.log("tick() recursing");
                tick();
            });
        } else {
            ticking = false;
        }
    }
}


class RafSub<M> extends Sub<M> {

    readonly mapper: (t:number) => M;

    constructor(mapper: (t: number) => M) {
        super();
        this.mapper = mapper;
    }

    protected onInit() {
        super.onInit();
        subs.push(this);
        tick();
    }

    protected onRelease() {
        super.onRelease();
        subs = subs.filter(s => s !== this);
        if (subs.length === 0) {
            ticking = false;
        }
    }

    trigger(t:number) {
        this.dispatch(this.mapper(t))
    }
}


export function onAnimationFrame<M>(mapper:(t:number) => M) : Sub<M> {
    return new RafSub(mapper);
}