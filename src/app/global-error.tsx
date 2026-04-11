"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body style={{ padding: 40, fontFamily: "monospace" }}>
        <h2>Something went wrong</h2>
        <pre style={{ whiteSpace: "pre-wrap", color: "red" }}>
          {error.message}
          {"\n\n"}
          {error.stack}
        </pre>
        <button onClick={reset} style={{ marginTop: 16, padding: "8px 16px" }}>
          Try again
        </button>
      </body>
    </html>
  );
}
