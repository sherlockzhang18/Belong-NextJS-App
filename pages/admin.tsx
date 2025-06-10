import { useRouter } from "next/router";

const ADMIN_PASSWORD = "123456";

export default function AdminPage() {
  const { query } = useRouter();
  const pw = Array.isArray(query.password) ? query.password[0] : query.password;

  // if no password
  if (!pw) {
    return <p>Missing password. Append <code>?password=YOUR_PASSWORD</code> to the URL.</p>;
  }
  if (pw !== ADMIN_PASSWORD) {
    return <p>Invalid password.</p>;
  }

  // Authorized
  return (
    <div style={{ padding: 20 }}>
      <h1> Admin Dashboard</h1>
      <p>Welcome, admin. 🛠️</p>
    </div>
  );
}