import Head from "next/head";
import Link from "next/link";
import { CartHook } from "@/context/useCart";

interface CartPageProps {
  cart: CartHook
}

export default function CartPage( {cart}: CartPageProps ) {

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

        {cart.items.length === 0 ? (
          <p>(empty)</p>
        ) : (
          <>
            <ul>
              {cart.items.map((i) => (
                <li key={i.id} style={{ marginBottom: 8 }}>
                  {i.title} x {i.quantity} = $
                  {(i.price * i.quantity).toFixed(2)}
                  <button onClick={() => cart.remove(i)} style={{ marginLeft: 8 }}>
                    Remove one
                  </button>
                </li>
              ))}
            </ul>
            <button onClick={cart.clear} style={{ marginTop: 12 }}>
              Clear cart
            </button>
          </>
        )}
      </main>
    </>
  );
}
