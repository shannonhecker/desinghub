import { describe, expect, it } from "vitest";
import nextConfig from "../../../next.config";

describe("HTTP response security policy", () => {
  it("protects every route from embedding and MIME sniffing without disclosing the framework", async () => {
    const rules = await nextConfig.headers?.();
    const headers = Object.fromEntries((rules?.find((r) => r.source === "/:path*")?.headers ?? []).map(({key,value}) => [key.toLowerCase(),value]));
    expect(nextConfig.poweredByHeader).toBe(false);
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    const csp = headers["content-security-policy"] ?? "";
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).not.toContain("api.anthropic.com");
    /* Every font is served from this origin (src/fonts): no font host is allowed. */
    expect(csp).not.toContain("fonts.googleapis.com");
    expect(csp).not.toContain("fonts.gstatic.com");
    expect(csp).toMatch(/font-src 'self'/);
    expect(csp).toContain("https://firestore.googleapis.com");
  });
});
