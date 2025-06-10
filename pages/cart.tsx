import Head from "next/head";
import Link from "next/link";
import { useCart } from "../context/CartContext";

export default function CartPage() {
  const { items, remove, clear } = useCart();

  return (
    <>
      <Head>
        <title>Your Cart - Chivent</title>
      </Head>

      <main style={{ padding: 20 }}>
        <header style={{ display: "flex", justifyContent: "space-between" }}>
          <h1>Your Cart</h1>
          <Link href="/"> Back to Events</Link>
        </header>

        {items.length === 0 ? (
          <p>(empty)</p>
        ) : (
          <>
            <ul>
              {items.map((i) => (
                <li key={i.id} style={{ marginBottom: 8 }}>
                  {i.title} x {i.quantity} = $
                  {(i.price * i.quantity).toFixed(2)}
                  <button onClick={() => remove(i)} style={{ marginLeft: 8 }}>
                    Remove one
                  </button>
                </li>
              ))}
            </ul>
            <button onClick={clear} style={{ marginTop: 12 }}>
              Clear cart
            </button>
          </>
        )}
      </main>
    </>
  );
}
