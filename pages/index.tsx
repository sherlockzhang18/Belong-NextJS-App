"use client";

import Head from "next/head";
import Link from "next/link";
import useCart, { Event } from "@/context/useCart";

export default function HomePage() {
  const { items, add } = useCart();

  // sample events
  const sampleEvents: Event[] = [
    {
      id: "evt-1",
      title: "Next.js Meetup",
      price: { id: "price_1", unit_amount: 2500, currency: "USD" },
      size: "General",
    },
    {
      id: "evt-2",
      title: "React Conference",
      price: { id: "price_2", unit_amount: 5000, currency: "USD" },
      size: "VIP",
    },
  ];

  return (
    <>
      <Head>
        <title>Events – Chivent</title>
      </Head>
      <main style={{ padding: 20 }}>
        <header style={{ display: "flex", justifyContent: "space-between" }}>
          <h1>Events</h1>
          <Link href="/cart">🛒 Cart ({items.length})</Link>
        </header>

        <div style={{ display: "grid", gap: 16, marginTop: 20 }}>
          {sampleEvents.map((evt) => (
            <div
              key={evt.id}
              style={{
                border: "1px solid #ccc",
                borderRadius: 8,
                padding: 16,
              }}
            >
              <h2>{evt.title}</h2>
              <p>Price: ${(evt.price?.unit_amount ?? 0) / 100}</p>
              <button onClick={() => add(evt)}>Add to cart</button>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
