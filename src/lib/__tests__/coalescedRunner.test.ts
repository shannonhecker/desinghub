import { describe, it, expect } from "vitest";
import { createCoalescedRunner } from "../coalescedRunner";

/* A task whose runs are resolved by hand, so a test controls exactly when
   "the save" finishes. */
function deferredTask() {
  const resolvers: (() => void)[] = [];
  let started = 0;
  const task = () =>
    new Promise<void>((resolve) => {
      started++;
      resolvers.push(resolve);
    });
  return { task, started: () => started, finish: (i: number) => resolvers[i]() };
}
const tick = () => new Promise((r) => setTimeout(r, 0));

describe("createCoalescedRunner - a save requested mid-save is not lost", () => {
  it("runs the task immediately when idle", async () => {
    const d = deferredTask();
    const runner = createCoalescedRunner(d.task);
    const done = runner.run();
    expect(d.started()).toBe(1);
    d.finish(0);
    await done;
    expect(d.started()).toBe(1);
  });

  it("a request during a run triggers exactly one follow-up run after it ends", async () => {
    const d = deferredTask();
    const runner = createCoalescedRunner(d.task);
    const done = runner.run(); // save A starts
    void runner.run(); // edit B comes due while A is in flight
    void runner.run(); // and edit C
    expect(d.started()).toBe(1);
    expect(runner.hasQueued()).toBe(true);

    d.finish(0); // A resolves
    await tick();
    expect(d.started()).toBe(2); // one follow-up, covering B and C
    expect(runner.hasQueued()).toBe(false);

    d.finish(1);
    await done;
    expect(d.started()).toBe(2);
  });

  it("is usable again after the queue drains", async () => {
    const d = deferredTask();
    const runner = createCoalescedRunner(d.task);
    const first = runner.run();
    d.finish(0);
    await first;
    const second = runner.run();
    expect(d.started()).toBe(2);
    d.finish(1);
    await second;
  });

  it("a failing run does not wedge the runner", async () => {
    let calls = 0;
    const runner = createCoalescedRunner(async () => {
      calls++;
      if (calls === 1) throw new Error("boom");
    });
    await expect(runner.run()).rejects.toThrow("boom");
    await runner.run();
    expect(calls).toBe(2);
  });
});
