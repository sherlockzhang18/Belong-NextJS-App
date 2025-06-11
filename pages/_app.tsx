import "@/styles/globals.css";
import { AppProps } from "next/app";
import { useCart } from "@/context/useCart";

export default function MyApp({ Component, pageProps }: AppProps) {
    const cart = useCart();
    return <Component {...pageProps} cart={cart}/>;
}
