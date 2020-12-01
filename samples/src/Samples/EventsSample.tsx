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

import * as React from 'react';
import { Dispatcher, Cmd, Sub, noCmd, nothing, just, Maybe, DocumentEvents } from 'react-tea-cup';

export type Model = {
  clicked: Maybe<MousePosition>
  moved: Maybe<MousePosition>
};

type MousePosition = {
  pos: Position;
  page: Position;
  offset: Position;
}

type Position = [number, number]

export type Msg = {
  type: 'clicked',
  position: MousePosition
} | {
  type: 'moved',
  position: MousePosition
};

export function init(): [Model, Cmd<Msg>] {
  return noCmd({
    clicked: nothing,
    moved: nothing
  });
}

export function view(dispatch: Dispatcher<Msg>, model: Model) {
  return (
    <div className="events">
      {model.clicked
        .map(viewPosition('Clicked'))
        .withDefault(<div>Waiting for click ...</div>)
      }
      {model.moved
        .map(viewPosition('Moved'))
        .withDefault(<div>Waiting for move ...</div>)
      }
    </div>
  );
}

export function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
  switch (msg.type) {
    case 'clicked': {
      const model1: Model = {
        ...model,
        clicked: just(msg.position)
      };
      return [model1, Cmd.none()];
    }
    case 'moved': {
      const model1: Model = {
        ...model,
        moved: just(msg.position)
      };
      return [model1, Cmd.none()];
    }
  }
}

const documentEvents = new DocumentEvents<Msg>();

export function subscriptions(model: Model): Sub<Msg> {
  return Sub.batch([
    documentEvents.on('click', (e: MouseEvent) => (
      {
        type: 'clicked',
        position: {
          pos: [e.x, e.y],
          page: [e.pageX, e.pageY],
          offset: [e.offsetX, e.offsetY]
        }
      } as Msg
    )),
    documentEvents.on('mousemove', (e: MouseEvent) => ({
      type: 'moved',
      position: {
        pos: [e.x, e.y],
        page: [e.pageX, e.pageY],
        offset: [e.offsetX, e.offsetY]
      }
    } as Msg))
  ]);
}

function viewPosition(title: string) {
  return (position: MousePosition) => {
    return (<div>
      <b>{title}: </b>
      Position {position.pos[0]},{position.pos[0]}&nbsp;
      Page {position.page[0]},{position.page[0]}&nbsp;
      Offset {position.offset[0]},{position.offset[0]}
    </div>
    );
  }
}