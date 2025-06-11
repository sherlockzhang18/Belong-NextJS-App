"use client";

import Link from "next/link";

export default function AdminPage() {
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    window.location.href = "/login";
  };

  return (
    <main style={{ padding: 20 }}>
      <h1>🔒 Admin Dashboard</h1>
      <button onClick={handleLogout}>Log Out</button>
      <nav style={{ marginTop: 20 }}>
        <Link href="/cart">Go to Cart</Link>
        <br />
        <Link href="/">Back to Home</Link>
      </nav>
    </main>
  );
}
