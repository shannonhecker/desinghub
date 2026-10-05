"use client";

/* ════════════════════════════════════════════════════════════
   useImageAttachment: the composer's one-image-per-turn state.
   Attach (picker), paste and drag-and-drop all funnel through
   attachFile -> prepareImageAttachment. The prepared image lives in
   this hook's state only; take() hands it to the send path and clears
   it, so it is never written to the builder store.
   ════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";
import {
  prepareImageAttachment,
  ImageAttachmentError,
  IMAGE_ERROR_COPY,
  type PreparedImage,
} from "@/lib/image/prepareImageAttachment";
import { ALLOWED_IMAGE_TYPES } from "@/lib/image/imageBytes";

export const IMAGE_ACCEPT = ALLOWED_IMAGE_TYPES.join(",");

export const ATTACH_COPY = {
  aiOff: "Reading an image needs AI, which is off right now.",
  oneAtATime: "One image at a time, so I used the first one.",
  attached: (name: string) => `Image attached: ${name}.`,
  replaced: (name: string) => `Image replaced with ${name}.`,
  removed: "Image removed.",
  preparing: "Preparing image…",
  restored: "Your image is back in the box.",
} as const;

/* True when HTML carries no visible text: only images, comments, meta
   and empty markup. "Copy image" in a browser puts exactly that next to the
   bitmap. */
function htmlIsOnlyImages(html: string): boolean {
  const visible = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .trim();
  return visible === "" && /<img\b/i.test(html);
}

export interface PasteClipboard {
  types: readonly string[];
  fileCount: number;
  /* text/plain and text/html contents (empty when absent). */
  text: string;
  html: string;
}

/** Paste takes over only a clipboard whose content is the image itself.
 *  Excel, Word, Keynote, Numbers and some browsers put a rendered bitmap
 *  next to real text; that paste must stay text. "Copy image" from a web
 *  page carries an <img>-only HTML fragment and no text, so it attaches. */
export function shouldInterceptPaste({ types, fileCount, text, html }: PasteClipboard): boolean {
  if (fileCount === 0) return false;
  if (text.trim() !== "") return false;
  if (types.includes("text/html") && html.trim() !== "" && !htmlIsOnlyImages(html)) return false;
  return true;
}

export interface ComposerImage {
  image: PreparedImage;
  name: string;
  previewUrl: string;
}

const hasFiles = (e: { dataTransfer?: DataTransfer | null }) =>
  Array.from(e.dataTransfer?.types ?? []).includes("Files");

export function useImageAttachment({ enabled }: { enabled: boolean }) {
  const [attachment, setAttachment] = useState<ComposerImage | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);
  /* Bumped on every error so the live region re-announces a repeat. */
  const [errorSeq, setErrorSeq] = useState(0);
  const setError = useCallback((message: string | null) => {
    setErrorState(message);
    if (message) setErrorSeq((n) => n + 1);
  }, []);
  /* Polite, screen-reader-only confirmation ("Image attached: x.png."). */
  const [notice, setNotice] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const dragDepth = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  /* Latest request wins when files arrive faster than they prepare. */
  const requestId = useRef(0);

  const attachFile = useCallback(
    async (file: File, extraNotice?: string) => {
      if (!enabled) {
        setError(ATTACH_COPY.aiOff);
        return;
      }
      const replacing = attachment !== null;
      const id = ++requestId.current;
      setBusy(true);
      setError(null);
      setNotice(ATTACH_COPY.preparing);
      try {
        const image = await prepareImageAttachment(file);
        if (id !== requestId.current) return;
        const name = file.name || "Pasted image";
        setAttachment({ image, name, previewUrl: `data:${image.mediaType};base64,${image.base64}` });
        const base = replacing ? ATTACH_COPY.replaced(name) : ATTACH_COPY.attached(name);
        setNotice(extraNotice ? `${base} ${extraNotice}` : base);
      } catch (err) {
        if (id !== requestId.current) return;
        setError(err instanceof ImageAttachmentError ? err.message : IMAGE_ERROR_COPY.unreadable);
      } finally {
        if (id === requestId.current) setBusy(false);
      }
    },
    [enabled, attachment, setError],
  );

  const attachFirst = useCallback(
    (files: FileList | File[] | null | undefined) => {
      const list = Array.from(files ?? []);
      if (list.length === 0) return false;
      void attachFile(list[0], list.length > 1 ? ATTACH_COPY.oneAtATime : undefined);
      return true;
    },
    [attachFile],
  );

  const openPicker = useCallback(() => fileInputRef.current?.click(), []);

  const onFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      attachFirst(e.target.files);
      /* Reset so picking the same file again still fires change. */
      e.target.value = "";
    },
    [attachFirst],
  );

  /* Paste: only clipboard FILES are taken over; pasted text is untouched. */
  const onPaste = useCallback(
    (e: React.ClipboardEvent) => {
      const cd = e.clipboardData;
      const files = Array.from(cd?.files ?? []);
      const types = Array.from(cd?.types ?? []);
      const clipboard: PasteClipboard = {
        types,
        fileCount: files.length,
        text: types.includes("text/plain") ? cd?.getData("text/plain") ?? "" : "",
        html: types.includes("text/html") ? cd?.getData("text/html") ?? "" : "",
      };
      if (!shouldInterceptPaste(clipboard)) return;
      e.preventDefault();
      attachFirst(files);
    },
    [attachFirst],
  );

  const dropHandlers = {
    onDragEnter: (e: React.DragEvent) => {
      if (!enabled || !hasFiles(e)) return;
      e.preventDefault();
      dragDepth.current += 1;
      setDragActive(true);
    },
    onDragOver: (e: React.DragEvent) => {
      if (!enabled || !hasFiles(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    },
    onDragLeave: (e: React.DragEvent) => {
      if (!enabled || !hasFiles(e)) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setDragActive(false);
    },
    onDrop: (e: React.DragEvent) => {
      if (!enabled || !hasFiles(e)) return;
      e.preventDefault();
      dragDepth.current = 0;
      setDragActive(false);
      attachFirst(e.dataTransfer.files);
    },
  };

  /* While the builder is mounted, a file dropped anywhere other than the
     composer must not navigate the tab away to open it. The composer's own
     handlers run first; this only cancels the browser default. */
  useEffect(() => {
    const guard = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault();
    };
    window.addEventListener("dragover", guard);
    window.addEventListener("drop", guard);
    return () => {
      window.removeEventListener("dragover", guard);
      window.removeEventListener("drop", guard);
    };
  }, []);

  const remove = useCallback(() => {
    requestId.current += 1;
    setBusy(false);
    setAttachment(null);
    setError(null);
    setNotice(ATTACH_COPY.removed);
  }, [setError]);

  /* Hand the image to the send path and forget it. */
  const take = useCallback((): ComposerImage | null => {
    const taken = attachment;
    setAttachment(null);
    setError(null);
    setNotice("");
    return taken;
  }, [attachment, setError]);

  /* Put an image back (a send that never reached the model). */
  /* Never over a newer attachment, or one being prepared: the user's latest
     choice wins over a request that bounced. */
  const latest = useRef<{ attachment: ComposerImage | null; busy: boolean }>({ attachment: null, busy: false });
  useEffect(() => {
    latest.current = { attachment, busy };
  }, [attachment, busy]);
  const restore = useCallback((image: PreparedImage, name: string) => {
    if (latest.current.busy || latest.current.attachment) return;
    const restored = { image, name, previewUrl: `data:${image.mediaType};base64,${image.base64}` };
    latest.current = { attachment: restored, busy: false };
    setAttachment(restored);
    setNotice(ATTACH_COPY.restored);
  }, []);

  const showError = useCallback((message: string | null) => setError(message), [setError]);
  const clearError = useCallback(() => setErrorState(null), []);

  return {
    attachment,
    busy,
    error,
    errorSeq,
    notice,
    dragActive,
    fileInputRef,
    openPicker,
    onFileInputChange,
    onPaste,
    dropHandlers,
    remove,
    take,
    restore,
    showError,
    clearError,
  };
}
