import Head from "next/head";
import Link from "next/link";
import { useCart, Event, CartHook } from "../context/useCart";

interface HomeProps {
  cart: CartHook
}

export default function Home( {cart}: HomeProps) {

  const sampleEvent: Event = {
    id: "evt-1",
    title: "Concert in the Park",
    price: 25,
  };

  return (
    <>
      <Head>
        <title>Events - Chivent</title>
      </Head>

      <main style={{ padding: 20 }}>
        <header style={{ display: "flex", justifyContent: "space-between" }}>
          <h1>Events</h1>
          <Link href="/cart"> Cart ({cart.items.length})</Link>
        </header>

        {/* sample event card */}
        <div
          style={{
            border: "1px solid #ccc",
            padding: 16,
            borderRadius: 8,
            maxWidth: 300,
          }}
        >
          <h2>{sampleEvent.title}</h2>
          <p>Price: ${sampleEvent.price.toFixed(2)}</p>
          <button onClick={() => cart.add(sampleEvent)}>Add to cart</button>
        </div>
      </main>
    </>
  );
}
