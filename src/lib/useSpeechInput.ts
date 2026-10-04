"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ════════════════════════════════════════════════════════════
   useSpeechInput — Web Speech dictation for the chat composer.
   Restores the capability behind the mic button removed in
   87377bd ("voice will return").

   Design constraints this hook encodes:
   • Constructor looked up at CALL time, never module scope:
     SSR-safe, and lets Playwright addInitScript stubs win.
   • `supported` flips in a mount effect so SSR markup and the
     first client paint agree (no hydration mismatch); gated on
     isSecureContext because the API only works there.
   • The session flag is a ref, not state: state updates are
     async and lose the double-click race (a second start()
     throws InvalidStateError).
   • onend is the sync point for listening=false (it fires after
     stop(), silence timeouts, tab switches). Errors also reset
     eagerly so the button never reads as hot after a denial.
   • abort() nulls the handlers BEFORE aborting: a recognizer
     can flush one last onresult after abort() returns, which
     would resurrect already-sent text into the composer.
   • No auto-restart from onend (stuck-open-mic privacy risk)
     and no auto-send: speech only fills the composer.
   ════════════════════════════════════════════════════════════ */

export type SpeechInputStatus =
  | "listening"
  | "stopped"
  | "denied"
  | "no-speech"
  | "network"
  | "audio-capture";

interface UseSpeechInputOptions {
  /** Receives the full transcript of the current dictation session:
      accumulated finals plus the trailing interim segment. */
  onTranscript: (transcript: string) => void;
  onStatus?: (status: SpeechInputStatus) => void;
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | undefined {
  if (typeof window === "undefined") return undefined;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

function statusForError(error: string): SpeechInputStatus {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return "denied";
    case "no-speech":
      return "no-speech";
    case "network":
      return "network";
    case "audio-capture":
      return "audio-capture";
    default:
      return "stopped";
  }
}

/* Joins transcript chunks with a space unless the engine already supplied
   one: Chrome prefixes subsequent results with a space, but other
   webkitSpeechRecognition implementations do not guarantee it. */
function glue(a: string, b: string): string {
  if (!a || !b) return a + b;
  return a.endsWith(" ") || b.startsWith(" ") ? a + b : `${a} ${b}`;
}

export function useSpeechInput({ onTranscript, onStatus }: UseSpeechInputOptions) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const sessionRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef("");
  const erroredRef = useRef(false);
  /* Rebase bookkeeping for resetTranscript: results at or below
     rebasedThroughRef were already reported (and folded into the caller's
     base text), so they are skipped when they re-fire or finalize. */
  const lastResultIndexRef = useRef(-1);
  const rebasedThroughRef = useRef(-1);
  /* Latest callbacks via ref so toggle/abort stay referentially stable.
     Updated in an effect (not during render, per react-hooks/refs);
     recognizer events only fire after commit, so it is never stale. */
  const callbacksRef = useRef({ onTranscript, onStatus });
  useEffect(() => {
    callbacksRef.current = { onTranscript, onStatus };
  });

  useEffect(() => {
    if (getRecognitionCtor() && window.isSecureContext === true) {
      setSupported(true);
    }
  }, []);

  const abort = useCallback(() => {
    const wasActive = sessionRef.current;
    sessionRef.current = false;
    finalRef.current = "";
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (rec) {
      rec.onstart = null;
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.abort();
      } catch {
        /* already stopped */
      }
    }
    setListening(false);
    if (wasActive) callbacksRef.current.onStatus?.("stopped");
  }, []);

  const toggle = useCallback(() => {
    if (sessionRef.current) {
      /* Graceful stop lets the recognizer flush a pending final result;
         onend then syncs listening=false. */
      try {
        recognitionRef.current?.stop();
      } catch {
        /* already stopped */
      }
      return;
    }
    const Ctor = getRecognitionCtor();
    if (!Ctor || window.isSecureContext !== true) return;

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.lang = document.documentElement.lang || navigator.language;
    rec.onstart = () => {
      setListening(true);
      callbacksRef.current.onStatus?.("listening");
    };
    rec.onresult = (event) => {
      if (recognitionRef.current !== rec) return;
      let interim = "";
      let sawNew = false;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (i <= rebasedThroughRef.current) continue;
        sawNew = true;
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) finalRef.current = glue(finalRef.current, text);
        else interim = glue(interim, text);
      }
      lastResultIndexRef.current = event.results.length - 1;
      /* Everything in this event was rebased away: reporting an empty
         transcript would clobber text the caller is mid-editing. */
      if (!sawNew) return;
      callbacksRef.current.onTranscript(glue(finalRef.current, interim).trim());
    };
    rec.onerror = (event) => {
      /* A superseded recognizer (errored, its onend still queued while a
         new session started) must not clobber the live session's state. */
      if (recognitionRef.current !== rec) return;
      erroredRef.current = true;
      sessionRef.current = false;
      setListening(false);
      callbacksRef.current.onStatus?.(statusForError(event.error));
    };
    rec.onend = () => {
      if (recognitionRef.current !== rec) return;
      sessionRef.current = false;
      recognitionRef.current = null;
      const errored = erroredRef.current;
      erroredRef.current = false;
      setListening(false);
      /* After an error the status callback already fired; a trailing
         "stopped" would overwrite the error announcement. */
      if (!errored) callbacksRef.current.onStatus?.("stopped");
    };

    erroredRef.current = false;
    finalRef.current = "";
    lastResultIndexRef.current = -1;
    rebasedThroughRef.current = -1;
    recognitionRef.current = rec;
    sessionRef.current = true;
    try {
      rec.start();
    } catch {
      sessionRef.current = false;
      recognitionRef.current = null;
      setListening(false);
    }
  }, []);

  /* Rebase for mid-session composer edits: drops the transcript reported
     so far (finals AND the in-flight interim, which the caller has already
     folded into its own base text) so only NEW utterances get reported. */
  const resetTranscript = useCallback(() => {
    finalRef.current = "";
    rebasedThroughRef.current = lastResultIndexRef.current;
  }, []);

  /* Hard-stop on unmount: ChatPanel unmounts on dock/float toggle and
     floating minimize. Docked minimize only CSS-hides the panel, so
     ChatPanel aborts that path itself when chatOpen flips false. */
  useEffect(() => abort, [abort]);

  return { supported, listening, toggle, abort, resetTranscript };
}
