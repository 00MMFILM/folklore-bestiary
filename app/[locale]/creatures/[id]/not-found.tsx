import Link from "next/link";

export default function CreatureNotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1a0a0a 0%, #0a0a0a 100%)",
        color: "#eed8c0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        textAlign: "center",
        padding: "24px",
      }}
    >
      <h1 style={{ fontSize: "64px", marginBottom: "8px", color: "#cc8844" }}>404</h1>
      <p style={{ fontSize: "20px", marginBottom: "8px" }}>Creature Not Found</p>
      <p style={{ fontSize: "14px", color: "#999", marginBottom: "32px" }}>
        The creature you are looking for does not exist in our bestiary.
      </p>
      <Link
        href="/"
        style={{
          background: "#cc8844",
          color: "#000",
          padding: "12px 32px",
          borderRadius: "8px",
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        Back to World Map
      </Link>
    </main>
  );
}
