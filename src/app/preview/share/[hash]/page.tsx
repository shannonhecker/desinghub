/**
 * Shared-canvas preview - read-only rendering of a Builder snapshot
 * whose state is encoded in the URL hash (base64-JSON, produced by
 * buildShareUrl in src/lib/shareState.ts).
 *
 * The route is intentionally stateless: no server storage, no auth,
 * just decode → validate → render. Anyone with the URL can see the
 * canvas; nothing to do with the sharer's session is leaked.
 */

import { notFound } from "next/navigation";
import { decodeShareState } from "@/lib/shareState";
import { SharedPreview } from "@/components/builder/SharedPreview";

export const dynamic = "force-dynamic";

export default async function SharedPreviewPage({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  const { hash } = await params;
  const state = decodeShareState(hash);
  if (!state) notFound();
  return <SharedPreview state={state} hash={hash} />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  const { hash } = await params;
  const state = decodeShareState(hash);
  const dsName = state?.designSystem
    ? {
        salt: "Salt DS",
        m3: "Material 3",
        fluent: "Fluent 2",
        ausos: "ausos DS",
      }[state.designSystem]
    : "Design Hub";
  return {
    title: `Shared preview - ${dsName}`,
    description: "A shared Design Hub canvas preview.",
  };
}
