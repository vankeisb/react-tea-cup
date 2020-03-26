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

import {ObjectSerializer} from "./ObjectSerializer";

class Customer {
    readonly name: string;
    readonly address?: Address;
    readonly orders: Order[];
    readonly optionalStuff?: string = undefined;
    readonly birthDate: Date;
    readonly anyThing: any = { yolo: true };

    constructor(name: string, birthDate: Date, address: Address, orders: Order[]) {
        this.name = name;
        this.address = address;
        this.orders = orders;
        this.birthDate = birthDate;
    }

    hasTooManyOrders(): boolean {
        return this.orders.length > 2;
    }

    livesInNice(): boolean {
        return this.address?.isInNice() === true;
    }
}

class Address {
    readonly street: string;
    readonly city: string;

    constructor(street: string, city: string) {
        this.street = street;
        this.city = city;
    }

    isInNice(): boolean {
        return this.city === "nice";
    }
}

class Order {
    readonly product: string;
    readonly price: number;


    constructor(product: string, price: number) {
        this.product = product;
        this.price = price;
    }

    isExpensive(): boolean {
        return this.price > 250;
    }
}

const birthDate: Date = new Date(Date.parse("2019-01-01T00:00:00.000Z"));

const customer: Customer = new Customer(
    "John",
    birthDate,
    new Address("rue du quai", "marseille"),
    [
        new Order("Gode", 300),
        new Order("React for dummies", 10),
        new Order("Tea", 100)
    ]
);

test("roundtrip customer", () => {
    const s: ObjectSerializer = ObjectSerializer
        .withClasses([Customer, Address, Order]);
    const str: string = s.serialize(customer);
    const c: Customer = s.deserialize(str) as Customer;
    expect(c.name).toBe("John");
    expect(c.birthDate.toISOString()).toBe(birthDate.toISOString());
    expect(c.hasTooManyOrders()).toBe(true);
    expect(c.livesInNice()).toBe(false);
    expect(c.address?.street).toBe("rue du quai");
    expect(c.address?.city).toBe("marseille");
    expect(c.orders[0].isExpensive()).toBe(true);
    expect(c.orders[0].product).toBe("Gode");
    expect(c.orders[1].isExpensive()).toBe(false);
    expect(c.optionalStuff).toBeUndefined();
    expect(c.anyThing.yolo).toBe(true);
});


