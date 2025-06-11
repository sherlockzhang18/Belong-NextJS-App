"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";

interface RouteGuardProps {
  children: React.ReactNode;
}

const PROTECTED_PATHS = ["/cart", "/admin"];

export default function RouteGuard({ children }: RouteGuardProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    authCheck(router.asPath);

    const hideOnRouteChange = () => setAuthorized(false);
    router.events.on("routeChangeStart", hideOnRouteChange);
    router.events.on("routeChangeComplete", authCheck);

    return () => {
      router.events.off("routeChangeStart", hideOnRouteChange);
      router.events.off("routeChangeComplete", authCheck);
    };
  }, []);

  function authCheck(url: string) {
    const path = url.split("?")[0];
    const isProtected = PROTECTED_PATHS.includes(path);
    const isLoggedIn = Boolean(localStorage.getItem("authToken"));

    if (isProtected && !isLoggedIn) {
      setAuthorized(false);
      router.push("/login");
    } else {
      setAuthorized(true);
    }
  }

  if (!authorized) {
    return null; // or a loading spinner
  }

  return <>{children}</>;
}
