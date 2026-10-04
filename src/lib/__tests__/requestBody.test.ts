import { describe, expect, it } from "vitest";
import { readJsonObject, readBoundedText } from "../requestBody";
const req = (body: string, headers = {}) => new Request("https://example.test", { method: "POST", body, headers });
describe("bounded request bodies", () => {
  it("reads JSON objects", async () => expect(await readJsonObject(req('{"ok":true}'), 100)).toEqual({ ok: true }));
  it.each(["null", "[]", "3", "{oops"])("returns a 400 error for %s", async body => {
    await expect(readJsonObject(req(body), 100)).rejects.toMatchObject({ status: 400 });
  });
  it("enforces the streamed byte count even without Content-Length", async () => {
    await expect(readBoundedText(req("é".repeat(6)), 10)).rejects.toMatchObject({ status: 413 });
  });
  it("rejects oversized declared lengths before reading", async () => {
    await expect(readBoundedText(req("a", { "content-length": "1000" }), 10)).rejects.toMatchObject({ status: 413 });
  });
});
