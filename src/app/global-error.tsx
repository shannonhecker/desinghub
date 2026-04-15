"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  const isDev = process.env.NODE_ENV === "development";

  return (
    <html>
      <body style={{ padding: 40, fontFamily: "monospace" }}>
        <h2>Something went wrong</h2>
        <p style={{ color: "red" }}>{error.message}</p>
        {isDev && (
          <pre style={{ whiteSpace: "pre-wrap", color: "red", fontSize: 12, opacity: 0.7 }}>
            {error.stack}
          </pre>
        )}
        <button onClick={reset} style={{ marginTop: 16, padding: "8px 16px" }}>
          Try again
        </button>
      </body>
    </html>
  );
}
