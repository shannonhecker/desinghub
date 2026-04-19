/**
 * /api/health - lightweight status probe for client UI.
 *
 * Returns a boolean-only snapshot of which backend-dependent features
 * are configured. The client reads this once on Builder mount and
 * uses it to gate UI: if `anthropicConfigured` is false, we disable
 * the Regenerate-data chip and the chat send button and show a
 * one-time banner explaining AI features are off.
 *
 * Never leak key material. Only the presence (truthy length) of each
 * env var is returned - `process.env.ANTHROPIC_API_KEY` and the
 * client-visible `NEXT_PUBLIC_FIREBASE_API_KEY` are boolean-coerced
 * and that's what crosses the wire.
 *
 * GET because the response has no side effects and is safe to cache
 * per-process (Next.js will revalidate on redeploy).
 */
export async function GET() {
  const anthropicConfigured = Boolean(process.env.ANTHROPIC_API_KEY);
  const firebaseConfigured = Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);

  return new Response(
    JSON.stringify({ anthropicConfigured, firebaseConfigured }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        /* Short cache so a dev restart after filling in .env.local
           surfaces the new state within a minute without a hard
           refresh. Public, same for every caller - no secrets. */
        "Cache-Control": "public, max-age=60",
      },
    },
  );
}
