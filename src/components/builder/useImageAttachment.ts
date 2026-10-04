"use client";

/* ════════════════════════════════════════════════════════════
   useImageAttachment: the composer's one-image-per-turn state.
   Attach (picker), paste and drag-and-drop all funnel through
   attachFile -> prepareImageAttachment. The prepared image lives in
   this hook's state only; take() hands it to the send path and clears
   it, so it is never written to the builder store.
   ════════════════════════════════════════════════════════════ */

import { useCallback, useRef, useState } from "react";
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
} as const;

export interface ComposerImage {
  image: PreparedImage;
  name: string;
  previewUrl: string;
}

const hasFiles = (e: React.DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");

export function useImageAttachment({ enabled }: { enabled: boolean }) {
  const [attachment, setAttachment] = useState<ComposerImage | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    [enabled, attachment],
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
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length === 0) return;
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

  const remove = useCallback(() => {
    requestId.current += 1;
    setBusy(false);
    setAttachment(null);
    setError(null);
    setNotice(ATTACH_COPY.removed);
  }, []);

  /* Hand the image to the send path and forget it. */
  const take = useCallback((): PreparedImage | null => {
    const image = attachment?.image ?? null;
    setAttachment(null);
    setError(null);
    setNotice("");
    return image;
  }, [attachment]);

  const showError = useCallback((message: string | null) => setError(message), []);

  return {
    attachment,
    busy,
    error,
    notice,
    dragActive,
    fileInputRef,
    openPicker,
    onFileInputChange,
    onPaste,
    dropHandlers,
    remove,
    take,
    showError,
  };
}
