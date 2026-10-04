import { describe, it, expect } from "vitest";
import { getComponents } from "@/data/registry";
import type { SystemId } from "@/store/useDesignHub";
import { CONCEPTS, EQ_SYSTEMS, conceptOf, resolveEquivalent, idsAcrossSystems, kitHref, switchHref, switchPlace } from "../kitEquivalence";
import { BUILDER_BLOCKS } from "../uiKitGroups";

const idsOf = (s: SystemId) => new Set([...getComponents(s).map((c) => c.id), BUILDER_BLOCKS.id]);

describe("kitEquivalence", () => {
  it("every id in the map exists in that system's registry", () => {
    for (const [key, concept] of Object.entries(CONCEPTS)) {
      for (const sys of EQ_SYSTEMS) {
        const id = concept.ids[sys];
        if (id) expect(idsOf(sys).has(id), `${key} -> ${sys}:${id}`).toBe(true);
      }
    }
  });

  it("every registry entry in every system belongs to exactly one concept", () => {
    for (const sys of EQ_SYSTEMS) {
      for (const id of idsOf(sys)) expect(conceptOf(sys, id), `${sys}:${id}`).not.toBeNull();
    }
    const seen = new Map<string, string>();
    for (const [key, concept] of Object.entries(CONCEPTS)) {
      for (const sys of EQ_SYSTEMS) {
        const id = concept.ids[sys];
        if (!id) continue;
        const k = `${sys}:${id}`;
        expect(seen.get(k), `${k} is in ${seen.get(k)} and ${key}`).toBeUndefined();
        seen.set(k, key);
      }
    }
  });

  it("every entry resolves in every other system: an equivalent, or closest matches that exist", () => {
    for (const from of EQ_SYSTEMS) for (const id of idsOf(from)) for (const to of EQ_SYSTEMS) {
      const eq = resolveEquivalent(from, id, to);
      if (eq.id) {
        expect(idsOf(to).has(eq.id), `${from}:${id} -> ${to}:${eq.id}`).toBe(true);
        expect(eq.closest).toEqual([]);
        expect(eq.systemOnly).toBe(false);
      } else {
        expect(eq.closest.length, `${from}:${id} -> ${to} offers matches`).toBeGreaterThan(0);
        for (const c of eq.closest) expect(idsOf(to).has(c.id), `${from}:${id} -> ${to} closest ${c.id}`).toBe(true);
      }
      expect(eq.label.length).toBeGreaterThan(0);
    }
  });

  it("equivalents are symmetric", () => {
    for (const from of EQ_SYSTEMS) for (const id of idsOf(from)) for (const to of EQ_SYSTEMS) {
      const eq = resolveEquivalent(from, id, to);
      if (eq.id) expect(resolveEquivalent(to, eq.id, from).id, `${from}:${id} <-> ${to}:${eq.id}`).toBe(id);
    }
  });

  it("keeps Button, Input, Data table and a pattern on the same thing", () => {
    expect(EQ_SYSTEMS.map((to) => resolveEquivalent("salt", "buttons", to).id)).toEqual(["buttons", "buttons", "buttons", "buttons", "buttons"]);
    expect(EQ_SYSTEMS.map((to) => resolveEquivalent("salt", "inputs", to).id)).toEqual(["inputs", "text-fields", "inputs", "inputs", "inputs"]);
    expect(resolveEquivalent("m3", "text-fields", "carbon").id).toBe("inputs");
    expect(resolveEquivalent("salt", "table", "carbon").id).toBe("data-table");
    expect(resolveEquivalent("carbon", "data-table", "uoaui").id).toBe("data-table");
    for (const to of EQ_SYSTEMS) expect(resolveEquivalent("salt", "pat-wizard", to).id).toBe("pat-wizard");
  });

  it("never redirects: a missing equivalent is null with the closest matches", () => {
    expect(resolveEquivalent("m3", "fabs", "carbon")).toEqual({ id: null, label: "FAB", systemOnly: true, closest: [{ id: "buttons", label: "Button" }] });
    /* Material has data tables; this library has no page for it yet. */
    expect(resolveEquivalent("salt", "table", "m3")).toEqual({ id: null, label: "Data table", systemOnly: false, closest: [{ id: "ag-grid", label: "AG Grid" }, { id: "buttons", label: "Button" }] });
    expect(resolveEquivalent("m3", "pat-feed", "salt").closest[0]).toEqual({ id: "pat-list-detail", label: "List and detail" });
    expect(resolveEquivalent("m3", "pat-feed", "salt").systemOnly).toBe(false);
    /* Closest matches stay inside the entry's own group. */
    for (const c of resolveEquivalent("carbon", "dl-motion", "salt").closest) expect(conceptOf("salt", c.id)!.startsWith("f-")).toBe(true);
  });

  it("lists a concept's id in each system for Compare", () => {
    expect(idsAcrossSystems("m3", "text-fields")).toEqual({ salt: "inputs", m3: "text-fields", fluent: "inputs", uoaui: "inputs", carbon: "inputs" });
    expect(Object.keys(idsAcrossSystems("m3", "fabs"))).toEqual(["m3"]);
  });

  it("builds shareable URLs and switcher links", () => {
    expect(kitHref({ ds: "salt" })).toBe("/ui-kit?ds=salt");
    expect(kitHref({ ds: "carbon", c: "buttons", tab: "code" })).toBe("/ui-kit?ds=carbon&c=buttons&tab=code");
    expect(kitHref({ ds: "m3", q: "date", show: "components" })).toBe("/ui-kit?ds=m3&q=date&show=components");
    expect(switchHref({ ds: "salt", c: "inputs", tab: "specs" }, "m3")).toBe("/ui-kit?ds=m3&c=text-fields&tab=specs");
    expect(switchHref({ ds: "salt", q: "date" }, "carbon")).toBe("/ui-kit?ds=carbon&q=date");
  });

  it("a missing equivalent keeps the place and finds its way back", () => {
    /* Material FAB -> Carbon: same entry, marked as Material's. */
    const missing = switchPlace({ ds: "m3", c: "fabs", tab: "code" }, "carbon");
    /* Only a handful of concepts are truly one system's own. */
    expect(Object.entries(CONCEPTS).filter(([, c]) => c.systemOnly).map(([k]) => k)).toEqual(["fab", "header", "f-state-layers"]);
    expect(missing).toEqual({ ds: "carbon", c: "fabs", from: "m3", tab: "code" });
    expect(kitHref(missing)).toBe("/ui-kit?ds=carbon&c=fabs&from=m3&tab=code");
    /* From that state, on to Salt (also none), then back to Material. */
    expect(switchPlace(missing, "salt")).toEqual({ ds: "salt", c: "fabs", from: "m3", tab: "code" });
    expect(switchPlace(missing, "m3")).toEqual({ ds: "m3", c: "fabs", from: null, tab: "code" });
  });
});
