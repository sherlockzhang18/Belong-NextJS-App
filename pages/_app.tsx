import "@/styles/globals.css";
import type { AppProps } from "next/app";
import RouteGuard from "@/components/RouteGuard";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <RouteGuard>
      <Component {...pageProps} />
    </RouteGuard>
  );
}
