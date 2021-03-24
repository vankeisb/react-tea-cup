/*
 * MIT License
 *
 * Copyright (c) 2019 Rémi Van Keisbelck
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

import { Dispatcher, Cmd, noCmd, Sub, onAnimationFrame } from 'tea-cup-core';
import * as React from 'react';

export interface Model {
  readonly started: boolean;
  readonly t: number;
  readonly fps: number;
  readonly animText: string;
}

export type Msg = { type: 'raf'; t: number } | { type: 'toggle' } | { type: 'text-changed'; text: string };

export function init() {
  return noCmd<Model, Msg>({
    started: false,
    t: 0,
    fps: 0,
    animText: 'This text gets animated...',
  });
}

export function view(dispatch: Dispatcher<Msg>, model: Model) {
  let fps, anim;
  if (model.started) {
    fps = <div>{Math.round(model.fps)} FPS</div>;
    anim = viewAnim(model.animText, model.t);
  }
  return (
    <div>
      <div>
        <input
          type="text"
          value={model.animText}
          onChange={(e) =>
            dispatch({
              type: 'text-changed',
              text: (e.target as HTMLInputElement).value,
            })
          }
        />
      </div>
      <span>Time = {Math.round(model.t)}</span>
      <button onClick={(_) => dispatch({ type: 'toggle' })}>{model.started ? 'Stop' : 'Start'}</button>
      {fps}
      {anim}
    </div>
  );
}

function viewAnim(text: String, t: number) {
  const a = text.split('').map((c, i) => {
    const st = t / 200;
    const y1 = Math.sin(st + i / 5) * 5;
    // const y2 = Math.sin(t / 666 + i) * 10;
    const style = {
      // paddingBottom: y + "px",
      // height: "24px",
      // width: "12px"
      display: 'block',
      fontSize: 32 + y1 + 'px',
    };
    return (
      <div key={i} style={style}>
        {c}
      </div>
    );
  });
  const style = {
    display: 'flex',
    padding: '12px',
    minHeight: '48px',
  };
  return <div style={style}>{a}</div>;
}

export function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
  switch (msg.type) {
    case 'toggle':
      return noCmd({ ...model, started: !model.started });
    case 'raf':
      const delta = msg.t - model.t;
      const fps = 1000 / delta;
      return noCmd({
        ...model,
        t: msg.t,
        fps: fps,
      });

    case 'text-changed':
      return noCmd({
        ...model,
        animText: msg.text,
      });
  }
}

export function subscriptions(model: Model) {
  if (model.started) {
    return onAnimationFrame((t: number) => {
      return { type: 'raf', t: t } as Msg;
    });
  } else {
    return Sub.none<Msg>();
  }
}
