/* ══════════════════════════════════════════════════════════
   coalescedRunner - run an async task one at a time, without
   losing a request that arrives while it is running.

   Auto-save used to drop a save that came due while another was
   in flight: if a write took longer than the debounce, the edits
   made during it were never written until the user happened to
   edit again. A request made mid-run now queues exactly one
   follow-up run, which starts as soon as the current one ends
   and therefore sees the latest state.
   ══════════════════════════════════════════════════════════ */

export interface CoalescedRunner {
  /** Run the task now, or - if it is already running - once more when the
   *  current run ends. Any number of requests mid-run collapse into one
   *  follow-up. Resolves when nothing is left to run. */
  run(): Promise<void>;
  /** True while a follow-up run is waiting for the current run to end. */
  hasQueued(): boolean;
}

export function createCoalescedRunner(task: () => Promise<void>): CoalescedRunner {
  let running = false;
  let queued = false;

  async function run(): Promise<void> {
    if (running) {
      queued = true;
      return;
    }
    running = true;
    try {
      do {
        queued = false;
        await task();
      } while (queued);
    } finally {
      running = false;
      queued = false;
    }
  }

  return { run, hasQueued: () => queued };
}
