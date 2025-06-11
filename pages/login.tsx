"use client";

import { useState } from "react";
import { useRouter } from "next/router";

const REAL_TOKEN = "123";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === REAL_TOKEN) {
      localStorage.setItem("authToken", REAL_TOKEN);
      router.push("/admin");
    } else {
      alert("Wrong password");
      setPassword("");
    }
  };

  return (
    <main style={{ padding: 20 }}>
      <h1>Admin Login</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Log In</button>
      </form>
    </main>
  );
}
