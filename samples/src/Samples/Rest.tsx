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

import { Cmd, Decode, Decoder, Dispatcher, Http, noCmd, Result, Task } from 'react-tea-cup';
import * as React from 'react';

export interface Commit {
  readonly sha: string;
  readonly author: string;
}

const commitDecoder: Decoder<Commit> = Decode.map2(
  (sha: string, author: string) => {
    return {
      sha: sha,
      author: author,
    };
  },
  Decode.field('sha', Decode.str),
  Decode.at(['commit', 'author', 'name'], Decode.str),
);

export type Model =
  | { readonly tag: 'loading' }
  | { readonly tag: 'loaded'; readonly commits: ReadonlyArray<Commit> }
  | { readonly tag: 'load-error'; readonly error: Error };

export type Msg = (model: Model) => [Model, Cmd<Msg>];

function gotCommits(response: Result<Error, ReadonlyArray<Commit>>): Msg {
  return () => {
    switch (response.tag) {
      case 'Ok':
        return noCmd({ tag: 'loaded', commits: response.value } as Model);
      case 'Err':
        return noCmd({ tag: 'load-error', error: response.err } as Model);
    }
  };
}

const buttonClicked: Msg = () => [{ tag: 'loading' }, listCommits()];

function listCommits(): Cmd<Msg> {
  return Task.attempt(
    Http.jsonBody(
      Http.fetch('https://api.github.com/repos/vankeisb/react-tea-cup/commits'),
      Decode.array(commitDecoder),
    ),
    gotCommits,
  );
}

export function init(): [Model, Cmd<Msg>] {
  return [{ tag: 'loading' }, listCommits()];
}

export function view(dispatch: Dispatcher<Msg>, model: Model) {
  let buttonText = 'List commits';
  let buttonDisabled = false;
  let content;

  switch (model.tag) {
    case 'loading':
      buttonText = 'Loading...';
      buttonDisabled = true;
      content = null;
      break;
    case 'load-error':
      content = <p>Ooops ! There was an error : {model.error}</p>;
      break;
    case 'loaded':
      content = (
        <ul>
          {model.commits.map((commit) => (
            <li key={commit.sha}>
              {commit.sha} - {commit.author}
            </li>
          ))}
        </ul>
      );
      break;
  }

  return (
    <div>
      <p>This shows how to use Http and decode. Click to list commits using the github API.</p>
      <button disabled={buttonDisabled} onClick={(_) => dispatch(buttonClicked)}>
        {buttonText}
      </button>
      <div style={{ minHeight: '300px' }}>{content}</div>
    </div>
  );
}

export function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
  return msg(model);
}
