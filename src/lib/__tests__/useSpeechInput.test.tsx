/* ════════════════════════════════════════════════════════════
   useSpeechInput — Web Speech dictation hook (voice restore).
   ────────────────────────────────────────────────────────────
   Powers the mic button being RESTORED after its removal in
   87377bd. jsdom has no Web Speech API, so a scriptable
   MockSpeechRecognition stands in and these tests pin:
     • secure-context + constructor feature gate
     • toggle start/stop lifecycle (onend syncs listening=false)
     • interim + final transcripts composed to the callback
     • permission-denied / no-speech reset state via onStatus
     • abort() hard-stops: a late onresult is IGNORED
       (transcript-resurrection guard) and unmount aborts

   No RTL in the repo — react-dom/client + act() probe component,
   matching useChatAPI.errors.test.tsx.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { useSpeechInput, type SpeechInputStatus } from "../useSpeechInput";

/* ── Scriptable SpeechRecognition stand-in ── */
class MockSpeechRecognition {
  static instances: MockSpeechRecognition[] = [];
  /* Flip false to hold a start "pending" (onstart not yet fired) so the
     double-toggle race guard can be exercised. */
  static autoFireOnStart = true;

  continuous = false;
  interimResults = false;
  maxAlternatives = 0;
  lang = "";
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null = null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null = null;

  start = vi.fn(() => {
    if (MockSpeechRecognition.autoFireOnStart) this.onstart?.();
  });
  stop = vi.fn(() => {
    this.onend?.();
  });
  abort = vi.fn(() => {
    this.onend?.();
  });

  constructor() {
    MockSpeechRecognition.instances.push(this);
  }

  emitResult(segments: { text: string; final: boolean }[], resultIndex = 0) {
    const results = segments.map((s) =>
      Object.assign([{ transcript: s.text }], { isFinal: s.final }),
    ) as unknown as SpeechRecognitionResultList;
    this.onresult?.({ resultIndex, results });
  }

  emitError(error: string) {
    /* Browsers fire onerror then onend. */
    this.onerror?.({ error });
    this.onend?.();
  }
}

function installSpeechApi() {
  Object.defineProperty(window, "webkitSpeechRecognition", {
    value: MockSpeechRecognition,
    configurable: true,
    writable: true,
  });
}

function removeSpeechApi() {
  delete (window as unknown as Record<string, unknown>).SpeechRecognition;
  delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
}

function setSecureContext(value: boolean) {
  /* jsdom leaves isSecureContext undefined, so the gate is stubbed
     explicitly per test. */
  Object.defineProperty(window, "isSecureContext", {
    value,
    configurable: true,
  });
}

/* ── Probe harness ── */
type HookApi = ReturnType<typeof useSpeechInput>;
let api: HookApi;
const transcripts: string[] = [];
const statuses: SpeechInputStatus[] = [];

function Probe() {
  api = useSpeechInput({
    onTranscript: (t) => transcripts.push(t),
    onStatus: (s) => statuses.push(s),
  });
  return null;
}

let root: Root | null = null;
let container: HTMLDivElement | null = null;

function mountProbe() {
  container = document.createElement("div");
  document.body.appendChild(container);
  act(() => {
    root = createRoot(container!);
    root.render(<Probe />);
  });
}

function lastInstance(): MockSpeechRecognition {
  const inst = MockSpeechRecognition.instances.at(-1);
  if (!inst) throw new Error("no MockSpeechRecognition instance created");
  return inst;
}

beforeEach(() => {
  MockSpeechRecognition.instances = [];
  MockSpeechRecognition.autoFireOnStart = true;
  transcripts.length = 0;
  statuses.length = 0;
  setSecureContext(true);
  installSpeechApi();
});

afterEach(() => {
  if (root) {
    const r = root;
    act(() => r.unmount());
    root = null;
  }
  container?.remove();
  container = null;
  removeSpeechApi();
});

describe("useSpeechInput: feature gate", () => {
  it("reports supported on a secure context with a constructor present", () => {
    mountProbe();
    expect(api.supported).toBe(true);
    expect(api.listening).toBe(false);
  });

  it("is unsupported when the API is absent, and toggle is a safe no-op", () => {
    removeSpeechApi();
    mountProbe();
    expect(api.supported).toBe(false);
    act(() => api.toggle());
    expect(api.listening).toBe(false);
    expect(MockSpeechRecognition.instances).toHaveLength(0);
  });

  it("is unsupported outside a secure context even with a constructor", () => {
    setSecureContext(false);
    mountProbe();
    expect(api.supported).toBe(false);
    act(() => api.toggle());
    expect(MockSpeechRecognition.instances).toHaveLength(0);
  });
});

describe("useSpeechInput: start/stop lifecycle", () => {
  it("toggle starts a continuous interim session; toggle again stops gracefully", () => {
    mountProbe();
    act(() => api.toggle());

    const rec = lastInstance();
    expect(rec.start).toHaveBeenCalledTimes(1);
    expect(rec.continuous).toBe(true);
    expect(rec.interimResults).toBe(true);
    expect(rec.maxAlternatives).toBe(1);
    expect(api.listening).toBe(true);
    expect(statuses).toContain("listening");

    act(() => api.toggle());
    /* Graceful stop (flushes a pending final), NOT abort. */
    expect(rec.stop).toHaveBeenCalledTimes(1);
    expect(rec.abort).not.toHaveBeenCalled();
    expect(api.listening).toBe(false);
    expect(statuses.at(-1)).toBe("stopped");
  });

  it("a second toggle while start is still pending stops the same session (no double start)", () => {
    MockSpeechRecognition.autoFireOnStart = false;
    mountProbe();
    act(() => api.toggle());
    act(() => api.toggle());
    expect(MockSpeechRecognition.instances).toHaveLength(1);
    expect(lastInstance().stop).toHaveBeenCalledTimes(1);
  });
});

describe("useSpeechInput: transcripts", () => {
  it("inserts a space between final segments when the engine omits one", () => {
    mountProbe();
    act(() => api.toggle());
    const rec = lastInstance();

    act(() => rec.emitResult([{ text: "add a table", final: true }]));
    /* Second utterance finalizes WITHOUT a leading space (Chrome adds
       one; other webkitSpeechRecognition engines do not guarantee it). */
    act(() =>
      rec.emitResult(
        [
          { text: "add a table", final: true },
          { text: "make it blue", final: true },
        ],
        1,
      ),
    );
    expect(transcripts.at(-1)).toBe("add a table make it blue");
  });

  it("resetTranscript rebases the session: already-reported results are dropped, new utterances flow", () => {
    mountProbe();
    act(() => api.toggle());
    const rec = lastInstance();

    act(() =>
      rec.emitResult([
        { text: "add a table", final: true },
        { text: " make it blu", final: false },
      ]),
    );
    expect(transcripts.at(-1)).toBe("add a table make it blu");
    const reported = transcripts.length;

    /* Caller folded everything reported so far (finals AND the pending
       interim) into its own base text, then rebased. */
    act(() => api.resetTranscript());

    /* The pending interim finalizes: already rebased, must NOT re-report. */
    act(() =>
      rec.emitResult(
        [
          { text: "add a table", final: true },
          { text: " make it blue", final: true },
        ],
        1,
      ),
    );
    expect(transcripts).toHaveLength(reported);

    /* A NEW utterance after the rebase reports alone. */
    act(() =>
      rec.emitResult(
        [
          { text: "add a table", final: true },
          { text: " make it blue", final: true },
          { text: "and a chart", final: false },
        ],
        2,
      ),
    );
    expect(transcripts.at(-1)).toBe("and a chart");
  });

  it("composes accumulated finals plus the trailing interim into the callback", () => {
    mountProbe();
    act(() => api.toggle());
    const rec = lastInstance();

    act(() =>
      rec.emitResult([
        { text: "hello", final: true },
        { text: " wor", final: false },
      ]),
    );
    expect(transcripts.at(-1)).toBe("hello wor");

    /* The interim tail at index 1 finalizes; resultIndex points past the
       already-accumulated final at index 0. */
    act(() =>
      rec.emitResult(
        [
          { text: "hello", final: true },
          { text: " world", final: true },
        ],
        1,
      ),
    );
    expect(transcripts.at(-1)).toBe("hello world");
  });
});

describe("useSpeechInput: errors", () => {
  it("permission denial surfaces via onStatus and resets listening", () => {
    mountProbe();
    act(() => api.toggle());
    expect(api.listening).toBe(true);

    act(() => lastInstance().emitError("not-allowed"));
    expect(api.listening).toBe(false);
    expect(statuses).toContain("denied");
    /* The trailing onend must not overwrite the error announcement. */
    expect(statuses.at(-1)).toBe("denied");
  });

  it("no-speech surfaces via onStatus and resets listening", () => {
    mountProbe();
    act(() => api.toggle());
    act(() => lastInstance().emitError("no-speech"));
    expect(api.listening).toBe(false);
    expect(statuses.at(-1)).toBe("no-speech");
  });

  it("a stale onend/onresult from a superseded recognizer cannot clobber the live session", () => {
    mountProbe();
    act(() => api.toggle());
    const recA = lastInstance();

    /* A errors; the browser queues its onend as a separate task. */
    act(() => recA.onerror?.({ error: "network" }));
    expect(api.listening).toBe(false);

    /* The user restarts in the error-to-end gap: recognizer B goes live. */
    act(() => api.toggle());
    const recB = lastInstance();
    expect(recB).not.toBe(recA);
    expect(api.listening).toBe(true);

    /* A's queued onend and a stray onresult land late: B is unaffected. */
    act(() => recA.onend?.());
    expect(api.listening).toBe(true);
    act(() => recA.emitResult([{ text: "stale", final: true }]));
    expect(transcripts).not.toContain("stale");

    /* B still stops normally through the toggle. */
    act(() => api.toggle());
    expect(recB.stop).toHaveBeenCalledTimes(1);
    expect(api.listening).toBe(false);
  });
});

describe("useSpeechInput: abort", () => {
  it("hard-stops and ignores a late onresult (transcript-resurrection guard)", () => {
    mountProbe();
    act(() => api.toggle());
    const rec = lastInstance();
    act(() => rec.emitResult([{ text: "draft one", final: true }]));
    expect(transcripts.at(-1)).toBe("draft one");
    const emitted = transcripts.length;

    act(() => api.abort());
    expect(rec.abort).toHaveBeenCalledTimes(1);
    expect(api.listening).toBe(false);
    expect(statuses.at(-1)).toBe("stopped");

    /* A recognizer can flush one last result after abort() returns. */
    act(() => rec.emitResult([{ text: "resurrected text", final: true }]));
    expect(transcripts).toHaveLength(emitted);
    expect(transcripts.at(-1)).toBe("draft one");
  });

  it("aborts the active session on unmount", () => {
    mountProbe();
    act(() => api.toggle());
    const rec = lastInstance();

    const r = root!;
    act(() => r.unmount());
    root = null;
    expect(rec.abort).toHaveBeenCalledTimes(1);
  });
});
