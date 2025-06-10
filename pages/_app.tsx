import "@/styles/globals.css";
import { AppProps } from "next/app";
import { CartProvider } from "../context/CartContext";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <CartProvider>
      <Component {...pageProps} />
    </CartProvider>
  );
}
