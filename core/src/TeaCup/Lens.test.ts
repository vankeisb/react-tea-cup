/*
 * MIT License
 *
 * Copyright (c) 2024 Rémi Van Keisbelck, Frank Wagner
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

import { Lenses, SubTypeGuard } from './Lens';
import {just, nothing} from './Maybe';

describe('lens', () => {
  test('id', () => {
    const lens = Lenses.id<string>();
    expect(lens.get('foo')).toEqual('foo');
    expect(lens.update('foo', (a) => a + 'bar')).toEqual('foobar');
  });

  test('field', () => {
    const StreetNameLens = Lenses.id<Street>().field('name');
    const street: Street = { name: 'main street', number: 42 };
    expect(StreetNameLens.get(street)).toEqual('main street');
    expect(StreetNameLens.update(street, (n) => 'small ' + n)).toEqual({ name: 'small main street', number: 42 });
  });

  test('deeper', () => {
    const AdressStreetNameLens = Lenses.id<Address>().field('street').field('name');
    const address: Address = {
      street: { name: 'main street', number: 42 },
      city: { name: 'Big', zip: '4242' },
    };
    expect(AdressStreetNameLens.get(address)).toEqual('main street');
    expect(AdressStreetNameLens.update(address, (n) => 'small ' + n)).toEqual({
      street: { name: 'small main street', number: 42 },
      city: { name: 'Big', zip: '4242' },
    });
  });

  test('discriminated guard s', () => {
    const d: SubTypeGuard<Page, UserPage> = Lenses.discriminate('tag', 'user');

    const userPage: Page = { tag: 'user', user: 'gnu' };
    const homePage: Page = { tag: 'home' };

    expect(d(userPage)).toEqual(just(userPage));
    expect(d(homePage)).toEqual(nothing);
  });

  test('discriminated guard with several tags', () => {
    const d: SubTypeGuard<Page2, UserPage2> = Lenses.discriminate('tag', 'user');
    const d2: SubTypeGuard<Page2, UserPage2> = Lenses.discriminate('tag2', 'user2');

    const userPage: Page2 = { tag: 'user', tag2: 'user2', user: 'gnu' };
    const homePage: Page2 = { tag: 'home', tag2: 'home2' };

    expect(d(userPage)).toEqual(just(userPage));
    expect(d(homePage)).toEqual(nothing);
    expect(d2(userPage)).toEqual(just(userPage));
    expect(d2(homePage)).toEqual(nothing);
  });

  test('discriminated sub type prism', () => {
    const UserPageUserPrism = Lenses.id<Page>().sub(Lenses.discriminate('tag', 'user'));

    const userPage: Page = { tag: 'user', user: 'gnu' };
    const homePage: Page = { tag: 'home' };

    expect(UserPageUserPrism.get(userPage)).toEqual(just(userPage));
    expect(UserPageUserPrism.get(homePage)).toEqual(nothing);

    expect(UserPageUserPrism.update(userPage, (u) => ({...u, user: "gnu!" }))).toEqual(just({ tag: 'user', user: 'gnu!' }));
    expect(UserPageUserPrism.update(homePage, (u) => ({...u, user: "gnu!" }))).toEqual(nothing);
  });

  test('discriminated sub type field prism', () => {
    // const UserPageUserPrism = Lenses.id<Page>().sub(p => p.tag === 'user' ? p as UserPage : undefined).field('user')

    const d: SubTypeGuard<Page, UserPage> = Lenses.discriminate('tag', 'user');
    const UserPageUserPrism = Lenses.id<Page>().sub(d).field('user');
    // WONTWORK
    // const UserPageUserPrism2 = Lenses.id<Page>().sub(Lenses.descriminate('tag', 'user')).field('user')

    const userPage: Page = { tag: 'user', user: 'gnu' };
    const homePage: Page = { tag: 'home' };

    expect(UserPageUserPrism.get(userPage)).toEqual(just('gnu'));
    expect(UserPageUserPrism.get(homePage)).toEqual(nothing);

    expect(UserPageUserPrism.update(userPage, (u) => u + '!')).toEqual(just({ tag: 'user', user: 'gnu!' }));
    expect(UserPageUserPrism.update(homePage, (u) => u + '!')).toEqual(nothing);
  });
});

interface Street {
  readonly name: string;
  readonly number: number;
}

interface City {
  readonly name: string;
  readonly zip: string;
}

interface Address {
  readonly street: Street;
  readonly city: City;
}

interface Model {
  readonly page: Page;
}

type Page = { readonly tag: 'home' } | UserPage;
type UserPage = { readonly tag: 'user'; readonly user: string };

type Page2 = { readonly tag: 'home'; readonly tag2: 'home2' } | UserPage2;
type UserPage2 = { readonly tag: 'user'; readonly tag2: 'user2'; readonly user: string };
