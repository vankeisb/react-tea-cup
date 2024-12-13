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

import { describe, expect, test } from "vitest";
import { discriminate, idLens, SubTypeGuard } from "./Lens";
import { just, Maybe, nothing } from "./Maybe";

describe("lens", () => {
  test("id", () => {
    const lens = idLens<string>();
    expect(lens.get("foo")).toEqual("foo");
    expect(lens.update("foo", (a) => a + "bar")).toEqual("foobar");
  });

  test("id with result", () => {
    const lens = idLens<string>();
    expect(lens.get("foo")).toEqual("foo");
    expect(lens.updateWithResult("foo", (a) => [a + "bar", 123])).toEqual([
      "foobar",
      123,
    ]);
  });

  test("field", () => {
    const StreetNameLens = idLens<Street>().field("name");
    const street: Street = { name: "main street", number: 42 };
    expect(StreetNameLens.get(street)).toEqual("main street");
    expect(StreetNameLens.update(street, (n) => "small " + n)).toEqual({
      name: "small main street",
      number: 42,
    });
  });

  test("field with result", () => {
    const StreetNameLens = idLens<Street>().field("name");
    const street: Street = { name: "main street", number: 42 };
    expect(StreetNameLens.get(street)).toEqual("main street");
    expect(
      StreetNameLens.updateWithResult(street, (n) => ["small " + n, "yalla"])
    ).toEqual([{ name: "small main street", number: 42 }, "yalla"]);
  });

  test("deeper", () => {
    const AdressStreetNameLens = idLens<Address>()
      .field("street")
      .field("name");
    const address: Address = {
      street: { name: "main street", number: 42 },
      city: { name: "Big", zip: "4242" },
    };
    expect(AdressStreetNameLens.get(address)).toEqual("main street");
    expect(AdressStreetNameLens.update(address, (n) => "small " + n)).toEqual({
      street: { name: "small main street", number: 42 },
      city: { name: "Big", zip: "4242" },
    });
  });

  test("deeper with result", () => {
    const AdressStreetNameLens = idLens<Address>()
      .field("street")
      .field("name");
    const address: Address = {
      street: { name: "main street", number: 42 },
      city: { name: "Big", zip: "4242" },
    };
    expect(AdressStreetNameLens.get(address)).toEqual("main street");
    expect(
      AdressStreetNameLens.updateWithResult(address, (n) => ["small " + n, 123])
    ).toEqual([
      {
        street: { name: "small main street", number: 42 },
        city: { name: "Big", zip: "4242" },
      },
      123,
    ]);
  });

  test("discriminated guard s", () => {
    const d: SubTypeGuard<Page, UserPage> = discriminate("tag", "user");

    const userPage: Page = { tag: "user", user: "gnu" };
    const homePage: Page = { tag: "home" };

    expect(d(userPage)).toEqual(just(userPage));
    expect(d(homePage)).toEqual(nothing);
  });

  test("discriminated guard with several tags", () => {
    const d: SubTypeGuard<Page2, UserPage2> = discriminate("tag", "user");
    const d2: SubTypeGuard<Page2, UserPage2> = discriminate("tag2", "user2");

    const userPage: Page2 = { tag: "user", tag2: "user2", user: "gnu" };
    const homePage: Page2 = { tag: "home", tag2: "home2" };

    expect(d(userPage)).toEqual(just(userPage));
    expect(d(homePage)).toEqual(nothing);
    expect(d2(userPage)).toEqual(just(userPage));
    expect(d2(homePage)).toEqual(nothing);
  });

  test("discriminated sub type prism", () => {
    const UserPageUserPrism = idLens<Page>().sub(discriminate("tag", "user"));

    const userPage: Page = { tag: "user", user: "gnu" };
    const homePage: Page = { tag: "home" };

    expect(UserPageUserPrism.get(userPage)).toEqual(just(userPage));
    expect(UserPageUserPrism.get(homePage)).toEqual(nothing);

    expect(
      UserPageUserPrism.update(userPage, (u) => ({ ...u, user: "gnu!" }))
    ).toEqual(just({ tag: "user", user: "gnu!" }));
    expect(
      UserPageUserPrism.update(homePage, (u) => ({ ...u, user: "gnu!" }))
    ).toEqual(nothing);
  });

  test("discriminated sub type prism with result", () => {
    const UserPageUserPrism = idLens<Page>().sub(discriminate("tag", "user"));

    const userPage: Page = { tag: "user", user: "gnu" };
    const homePage: Page = { tag: "home" };

    expect(UserPageUserPrism.get(userPage)).toEqual(just(userPage));
    expect(UserPageUserPrism.get(homePage)).toEqual(nothing);

    expect(
      UserPageUserPrism.updateWithResult(userPage, (u) => [
        { ...u, user: "gnu!" },
        123,
      ])
    ).toEqual(just([{ tag: "user", user: "gnu!" }, 123]));
    expect(
      UserPageUserPrism.updateWithResult(homePage, (u) => [
        { ...u, user: "gnu!" },
        123,
      ])
    ).toEqual(nothing);
  });

  const player: MusicPlayer = {
    tag: "player",
    tab: {
      tag: "artists",
      count: 123,
    },
  };

  const playerHome: MusicPlayer = {
    tag: "home",
  };

  const playerAlbums: MusicPlayer = {
    tag: "player",
    tab: {
      tag: "albums",
    },
  };

  test("discriminated sub type field prism", () => {
    // const UserPageUserPrism = idLens<Page>().sub(p => p.tag === 'user' ? p as UserPage : undefined).field('user')

    const UserPageUserPrism = idLens<Page>().sub<UserPage>(discriminate("tag", "user")).field("user");
    // WONTWORK
    // const UserPageUserPrism2 = idLens<Page>().sub(Lenses.descriminate('tag', 'user')).field('user')

    const userPage: Page = { tag: "user", user: "gnu" };
    const homePage: Page = { tag: "home" };

    expect(UserPageUserPrism.get(userPage)).toEqual(just("gnu"));
    expect(UserPageUserPrism.get(homePage)).toEqual(nothing);

    expect(UserPageUserPrism.update(userPage, (u) => u + "!")).toEqual(
      just({ tag: "user", user: "gnu!" })
    );
    expect(UserPageUserPrism.update(homePage, (u) => u + "!")).toEqual(nothing);
  });

  test("discriminated sub twice", () => {
    const ArtistsPrism = idLens<MusicPlayer>()
      .sub<Player>(discriminate("tag", "player"))
      .field("tab")
      .sub<Artists>(discriminate("tag", "artists"))
      .field("count");

    expect(ArtistsPrism.get(player)).toEqual(just(123));
    expect(ArtistsPrism.get(playerHome)).toEqual(nothing);
    expect(ArtistsPrism.get(playerAlbums)).toEqual(nothing);
    expect(ArtistsPrism.update(player, (c) => c + 1)).toEqual(
      just({
        tag: "player",
        tab: {
          tag: "artists",
          count: 124,
        },
      })
    );
    expect(ArtistsPrism.update(playerHome, (c) => c + 1)).toEqual(nothing);
    expect(ArtistsPrism.update(playerAlbums, (c) => c + 1)).toEqual(nothing);
  });

  test("discriminated sub twice with result", () => {
    const ArtistsPrism = idLens<MusicPlayer>()
      .sub<Player>(discriminate("tag", "player"))
      .field("tab")
      .sub<Artists>(discriminate("tag", "artists"))
      .field("count");

    expect(ArtistsPrism.updateWithResult(player, (c) => [c + 1, 123])).toEqual(
      just([
        {
          tag: "player",
          tab: {
            tag: "artists",
            count: 124,
          },
        },
        123,
      ])
    );
    expect(
      ArtistsPrism.updateWithResult(playerHome, (c) => [c + 1, 123])
    ).toEqual(nothing);
    expect(
      ArtistsPrism.updateWithResult(playerAlbums, (c) => [c + 1, 123])
    ).toEqual(nothing);
  });

  test("compose lenses", () => {
    const streetLens = idLens<Address>().field("street");
    const nameLens = idLens<Street>().field("name");
    const composed = streetLens.andThenLens(nameLens);

    const address: Address = {
      street: { name: "main street", number: 42 },
      city: { name: "Big", zip: "4242" },
    };
    expect(composed.get(address)).toEqual("main street");
    expect(composed.update(address, (n) => "small " + n)).toEqual({
      street: { name: "small main street", number: 42 },
      city: { name: "Big", zip: "4242" },
    });
  });

  test("compose lenses with result", () => {
    const streetLens = idLens<Address>().field("street");
    const nameLens = idLens<Street>().field("name");
    const composed = streetLens.andThenLens(nameLens);

    const address: Address = {
      street: { name: "main street", number: 42 },
      city: { name: "Big", zip: "4242" },
    };
    expect(
      composed.updateWithResult(address, (n) => ["small " + n, true])
    ).toEqual([
      {
        street: { name: "small main street", number: 42 },
        city: { name: "Big", zip: "4242" },
      },
      true,
    ]);
  });

  test("compose prism and lens", () => {
    const p = idLens<Page>().sub<UserPage>(discriminate("tag", "user"));
    const l = idLens<UserPage>().field("user");
    const composed = p.andThen(l);

    const userPage: Page = { tag: "user", user: "gnu" };
    const homePage: Page = { tag: "home" };

    expect(composed.get(userPage)).toEqual(just("gnu"));
    expect(composed.get(homePage)).toEqual(nothing);

    expect(composed.update(userPage, (u) => u + "!")).toEqual(
      just({ tag: "user", user: "gnu!" })
    );
    expect(composed.update(homePage, (u) => u + "!")).toEqual(nothing);
  });

  test("compose prism and lens with result", () => {
    const p = idLens<Page>().sub<UserPage>(discriminate("tag", "user"));
    const l = idLens<UserPage>().field("user");
    const composed = p.andThen(l);

    const userPage: Page = { tag: "user", user: "gnu" };
    const homePage: Page = { tag: "home" };

    expect(composed.get(userPage)).toEqual(just("gnu"));
    expect(composed.get(homePage)).toEqual(nothing);

    expect(
      composed.updateWithResult(userPage, (u) => [u + "!", false])
    ).toEqual(just([{ tag: "user", user: "gnu!" }, false]));
    expect(
      composed.updateWithResult(homePage, (u) => [u + "!", false])
    ).toEqual(nothing);
  });

  test("compose prisms", () => {
    const p1 = idLens<MusicPlayer>().sub<Player>(discriminate("tag", "player"));
    const p2 = idLens<Player>()
      .field("tab")
      .sub<Artists>(discriminate("tag", "artists"));
    const composed = p1.andThen(p2);

    expect(
      composed.updateWithResult(player, (c) => [{ ...c, count: 456 }, false])
    ).toEqual(
      just([
        {
          tag: "player",
          tab: {
            tag: "artists",
            count: 456,
          },
        },
        false,
      ])
    );
    expect(
      composed.updateWithResult(playerHome, (c) => [{ ...c, count: 456 }, 123])
    ).toEqual(nothing);
    expect(
      composed.updateWithResult(playerAlbums, (c) => [
        { ...c, count: 456 },
        123,
      ])
    ).toEqual(nothing);
  });

  const app1: AppWithPage = {
    page: just({
      tag: "home",
    }),
  };

  const app2: AppWithPage = {
    page: nothing,
  };

  test("flatten field maybe", () => {
    const l = idLens<AppWithPage>().field("page").flatten();

    expect(l.get(app1)).toEqual(just({ tag: "home" }));
    expect(l.get(app2)).toEqual(nothing);

    expect(l.update(app1, () => ({ tag: "user", user: "foobar" }))).toEqual(
      just({
        page: just({ tag: "user", user: "foobar" }),
      })
    );
    expect(l.update(app2, () => ({ tag: "user", user: "foobar" }))).toEqual(
      nothing
    );
  });

  test("set maybe field", () => {
    const l = idLens<AppWithPage>().field("page");
    expect(l.get(app1)).toEqual(
      just({
        tag: "home",
      })
    );
    expect(l.update(app1, () => nothing)).toEqual({
      page: nothing,
    });
  });

  test("flatten prisms", () => {
    const p = idLens<Page>().sub<MorePage>(discriminate("tag", "more"));
    const l = idLens<MorePage>().field("more");
    const flattened = p.andThen(l).flatten();

    // const compileError1 = idLens<Page>().flatten().set({ tag: "home" }, 13);
    // const compileError1 = idLens<Page>().flatten().get({ tag: "home" }).withDefault(13);

    const morePage1: Page = { tag: "more", more: nothing };
    const morePage2: Page = { tag: "more", more: just("gnu") };
    const homePage: Page = { tag: "home" };

    expect(flattened.get(morePage1)).toEqual(nothing);
    expect(flattened.get(morePage2)).toEqual(just("gnu"));
    expect(flattened.get(homePage)).toEqual(nothing);

    expect(flattened.update(morePage1, (u) => u + "!")).toEqual(nothing);
    expect(flattened.update(morePage2, (u) => u + "!")).toEqual(
      just({ tag: "more", more: just("gnu!") })
    );
    expect(flattened.update(homePage, (u) => u + "!")).toEqual(nothing);
  });
});

interface AppWithPage {
  readonly page: Maybe<Page>;
}

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

type Page = { readonly tag: "home" } | UserPage | MorePage;
type UserPage = { readonly tag: "user"; readonly user: string };
type MorePage = { readonly tag: "more"; readonly more: Maybe<string> };

type Page2 = { readonly tag: "home"; readonly tag2: "home2" } | UserPage2;
type UserPage2 = {
  readonly tag: "user";
  readonly tag2: "user2";
  readonly user: string;
};

type MusicPlayer = { tag: "home" } | Player;
type Player = { tag: "player"; tab: Tab };
type Tab = { tag: "albums" } | Artists;
type Artists = { tag: "artists"; count: number };
