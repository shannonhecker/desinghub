"use client";

/* Composer pieces for the one-image-per-turn attachment: the attach
   button, the thumbnail chip, the drop veil and the polite status line.
   State lives in useImageAttachment; these only render it. */

import { ChromeIcon } from "./ChromeIcon";
import type React from "react";
import type { ComposerImage } from "./useImageAttachment";
import { IMAGE_ACCEPT } from "./useImageAttachment";

export function ComposerAttachButton({
  onClick,
  inputRef,
  onChange,
  disabled,
}: {
  onClick: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}) {
  return (
    <>
      <button
        type="button"
        className="toolbar-icon-btn composer-attach-btn"
        onClick={onClick}
        disabled={disabled}
        aria-label="Attach an image"
        title="Attach an image to build from (PNG, JPEG, WebP or GIF). You can also paste or drop one."
      >
        <ChromeIcon name="add_photo_alternate" aria-hidden="true" />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        onChange={onChange}
        className="composer-file-input"
        tabIndex={-1}
        aria-hidden="true"
        data-testid="composer-file-input"
      />
    </>
  );
}

export function ComposerAttachmentChip({
  attachment,
  busy,
  onRemove,
}: {
  attachment: ComposerImage | null;
  busy: boolean;
  onRemove: () => void;
}) {
  if (!attachment && !busy) return null;
  if (!attachment) {
    return (
      <div className="composer-attachment is-busy" aria-hidden="true">
        <span className="composer-attachment-thumb composer-attachment-thumb-pending" />
        <span className="composer-attachment-meta">
          <span className="composer-attachment-name">Preparing image…</span>
        </span>
      </div>
    );
  }
  const { image, name, previewUrl } = attachment;
  return (
    <div className="composer-attachment" role="group" aria-label={`Attached image: ${name}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a local data URL preview, not a remote asset */}
      <img className="composer-attachment-thumb" src={previewUrl} alt="" />
      <span className="composer-attachment-meta">
        <span className="composer-attachment-name" title={name}>{name}</span>
        <span className="composer-attachment-dims">
          {image.width} × {image.height}
        </span>
      </span>
      <button type="button" className="composer-attachment-remove" onClick={onRemove} aria-label="Remove image" title="Remove image">
        <ChromeIcon name="close" aria-hidden="true" />
      </button>
    </div>
  );
}

export function ComposerDropVeil({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="composer-drop-veil" aria-hidden="true">
      <ChromeIcon name="add_photo_alternate" className="composer-drop-icon" />
      <span className="composer-drop-label">Drop an image to build from it</span>
    </div>
  );
}

/* Errors are visible; confirmations are for screen readers only. Both go
   through one polite live region so nothing interrupts typing. The error
   node is keyed by a sequence number, so a repeated error is re-inserted
   and announced again. Dismiss sits outside the live region. */
export function ComposerAttachStatus({
  error,
  errorSeq,
  notice,
  onDismiss,
}: {
  error: string | null;
  errorSeq: number;
  notice: string;
  onDismiss: () => void;
}) {
  return (
    <div className={`composer-attach-status${error ? " has-error" : ""}`}>
      <div className="composer-attach-live" role="status" aria-live="polite">
        {error ? (
          <p key={errorSeq} className="composer-attach-error">
            <ChromeIcon name="error" aria-hidden="true" />
            <span>{error}</span>
          </p>
        ) : (
          <span className="composer-sr-only">{notice}</span>
        )}
      </div>
      {error && (
        <button type="button" className="composer-attach-dismiss" onClick={onDismiss} aria-label="Dismiss message" title="Dismiss">
          <ChromeIcon name="close" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function ImageAttachedMarker() {
  return (
    <span className="chat-msg-attachment">
      <ChromeIcon name="image" aria-hidden="true" />
      Image attached
    </span>
  );
}
