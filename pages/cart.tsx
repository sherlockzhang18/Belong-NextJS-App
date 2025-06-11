"use client";

import Head from "next/head";
import Link from "next/link";
import useCart from "@/context/useCart";

export default function CartPage() {
  const { items, remove, clear, checkout } = useCart();

  return (
    <>
      <Head>
        <title>Your Cart – Chivent</title>
      </Head>
      <main style={{ padding: 20 }}>
        <header style={{ display: "flex", justifyContent: "space-between" }}>
          <h1>Your Cart</h1>
          <Link href="/">← Back to Home</Link>
        </header>

        {items.length === 0 ? (
          <p>(empty)</p>
        ) : (
          <>
            <ul style={{ marginTop: 20 }}>
              {items.map((i) => (
                <li key={`${i.id}-${i.size}`} style={{ marginBottom: 12 }}>
                  {i.title} × {i.quantity} = $
                  {((i.price?.unit_amount ?? 0) * (i.quantity ?? 1)) / 100}
                  <button
                    onClick={() => remove(i.id, i.size)}
                    style={{ marginLeft: 8 }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <button onClick={clear} style={{ marginTop: 12 }}>
              Clear cart
            </button>
            <pre style={{ marginTop: 20 }}>
              Checkout payload: {JSON.stringify(checkout(), null, 2)}
            </pre>
          </>
        )}
      </main>
    </>
  );
}
