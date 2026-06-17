"use client";

import { createContext, useContext } from "react";

/* Amendable context (Phase 1, Lovable-style amend flow).
   True ONLY in the author's Present mode, where clicking a block on the live
   render selects it for an in-place AI amend (the PresentAmendComposer).
   Default false so the other read-only surfaces — the in-app Preview pane and
   the shared-link recipient view — stay non-amendable.

   It sits alongside PreviewReadOnlyContext: `readOnly` suppresses editor chrome
   (drag handles, inspector, +Add); `amendable` re-enables ONLY block selection,
   for the amend flow, on top of that read-only base. */
export const AmendableContext = createContext(false);

export function useAmendable(): boolean {
  return useContext(AmendableContext);
}
